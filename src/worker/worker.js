import "../lib/tracing.js";
import { config } from "../config.js";
import { logger, withTrace } from "../lib/logger.js";
import { createRedisClient } from "../lib/redisClient.js";
import { markProcessing, markCompleted, getStatus } from "./idempotency.js";
import { handleStandardJob } from "./handlers/standard.js";
import { handleLLMTask } from "./handlers/llmTask.js";
import { startMetricsServer } from "../lib/metricsServer.js";
import { decryptSensitivePayloadFields } from "../lib/security.js";
import { sendDlqAlert } from "../lib/alerting.js";

import {
  jobsProcessedTotal,
  jobsFailedTotal,
  jobsRetriedTotal,
  jobsDlqTotal,
  jobDurationSeconds,
  queueDepthGauge,
} from "../lib/metrics.js";
import { tracer, getTraceId } from "../lib/tracing.js";

const redis = createRedisClient("worker");
const WORKER_ID = `worker-${process.pid}`;
const RECENT_JOBS_KEY = "recent:jobs";

startMetricsServer(Number(process.env.WORKER_METRICS_PORT) || 9101, "worker");

async function claimJob() {
  const raw = await redis.lmove(config.queues.main, config.queues.processing, "RIGHT", "LEFT");
  if (!raw) return null;
  const job = JSON.parse(raw);
  await redis.hset(config.processingTimestamps, job.job_id, Date.now());
  return { job, raw };
}

async function removeFromProcessing(raw, jobId) {
  await redis.lrem(config.queues.processing, 1, raw);
  await redis.hdel(config.processingTimestamps, jobId);
}

async function sendToRetryOrDLQ(job, raw, traceId) {
  const nextRetryCount = job.retry_count + 1;

  if (nextRetryCount > config.retry.maxRetries) {
    const dlqEntry = {
      ...job,
      retry_count: nextRetryCount,
      dlq_reason: "max_retries_exceeded",
      dlq_at: new Date().toISOString(),
    };
    await redis.lpush(config.queues.dlq, JSON.stringify(dlqEntry));
    jobsDlqTotal.inc({ job_type: job.job_type });
    logger.error(withTrace(traceId, { job_id: job.job_id, retries: nextRetryCount }), "job moved to DLQ");
    await sendDlqAlert(dlqEntry); // fire-and-forget, doesn't block worker loop
    return;
  }

  const delayMs = config.retry.backoffMs[job.retry_count] || config.retry.backoffMs.at(-1);
  const nextAttemptAt = Date.now() + delayMs;
  const updatedJob = { ...job, retry_count: nextRetryCount };

  await redis.zadd(config.queues.retry, nextAttemptAt, JSON.stringify(updatedJob));
  jobsRetriedTotal.inc({ job_type: job.job_type });
  logger.warn(
    withTrace(traceId, { job_id: job.job_id, retry_count: nextRetryCount, delayMs }),
    "job scheduled for retry"
  );
}

async function processJob(job, raw) {
  job.payload = decryptSensitivePayloadFields(job.payload);
  const span = tracer.startSpan("worker.process_job", {
    attributes: { "job.id": job.job_id, "job.type": job.job_type },
  });
  const traceId = getTraceId(span);
  const startTime = Date.now();

  const status = await getStatus(redis, job.idempotency_key);
  if (status === "completed") {
    logger.warn(withTrace(traceId, { job_id: job.job_id }), "duplicate delivery — skipping");
    await removeFromProcessing(raw, job.job_id);
    span.end();
    return;
  }

  await markProcessing(redis, job.idempotency_key);

  try {
    if (job.job_type === "standard") {
      await handleStandardJob(job);
    } else if (job.job_type === "llm_task") {
      await handleLLMTask(job);
    } else {
      throw new Error(`unknown job_type: ${job.job_type}`);
    }

    await markCompleted(redis, job.idempotency_key);
    await removeFromProcessing(raw, job.job_id);

    const durationSec = (Date.now() - startTime) / 1000;
    jobsProcessedTotal.inc({ job_type: job.job_type });
    jobDurationSeconds.observe({ job_type: job.job_type }, durationSec);

    logger.info(withTrace(traceId, { job_id: job.job_id, durationSec }), "job completed successfully");
    await redis.lpush(
      RECENT_JOBS_KEY,
      JSON.stringify({ job_id: job.job_id, job_type: job.job_type, status: "completed", durationSec, at: new Date().toISOString() })
    );
    await redis.ltrim(RECENT_JOBS_KEY, 0, 49); // keep last 50
    span.setStatus({ code: 1 });
  } catch (err) {
    jobsFailedTotal.inc({ job_type: job.job_type });
    logger.error(withTrace(traceId, { job_id: job.job_id, err: err.message }), "job failed");
    span.recordException(err);
    span.setStatus({ code: 2, message: err.message });
    await removeFromProcessing(raw, job.job_id);
    await sendToRetryOrDLQ(job, raw, traceId);
  } finally {
    span.end();
  }
}

async function updateQueueDepthMetrics() {
  const [main, processing, dlq, retry] = await Promise.all([
    redis.llen(config.queues.main),
    redis.llen(config.queues.processing),
    redis.llen(config.queues.dlq),
    redis.zcard(config.queues.retry),
  ]);
  queueDepthGauge.set({ queue: "main" }, main);
  queueDepthGauge.set({ queue: "processing" }, processing);
  queueDepthGauge.set({ queue: "dlq" }, dlq);
  queueDepthGauge.set({ queue: "retry" }, retry);
}

async function loop() {
  logger.info(`${WORKER_ID} started, polling ${config.queues.main}`);
  let tick = 0;
  while (true) {
    const claimed = await claimJob();
    if (!claimed) {
      if (tick++ % 10 === 0) await updateQueueDepthMetrics(); // update every ~5s of idle polling
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
    await processJob(claimed.job, claimed.raw);
  }
}

loop();