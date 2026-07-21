import "../lib/tracing.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { createRedisClient } from "../lib/redisClient.js";
import { startMetricsServer } from "../lib/metricsServer.js";

const redis = createRedisClient("scheduler");

startMetricsServer(Number(process.env.PORT) || Number(process.env.SCHEDULER_METRICS_PORT) || 9103, "scheduler");

async function tick() {
  const now = Date.now();
  const dueJobs = await redis.zrangebyscore(config.queues.retry, 0, now);

  for (const raw of dueJobs) {
    const removed = await redis.zrem(config.queues.retry, raw);
    if (removed === 1) {
      await redis.lpush(config.queues.main, raw);
      const job = JSON.parse(raw);
      logger.info({ job_id: job.job_id, retry_count: job.retry_count }, "retry due — re-enqueued");
    }
  }
}

async function loop() {
  logger.info(`Retry scheduler started, polling every ${config.schedulerPollIntervalMs}ms`);
  while (true) {
    try {
      await tick();
    } catch (err) {
      logger.error({ err: err.message }, "scheduler tick failed");
    }
    await new Promise((r) => setTimeout(r, config.schedulerPollIntervalMs));
  }
}

loop();