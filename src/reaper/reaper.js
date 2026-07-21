import "../lib/tracing.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { createRedisClient } from "../lib/redisClient.js";
import { startMetricsServer } from "../lib/metricsServer.js";
import { jobsReapedTotal } from "../lib/metrics.js";

const redis = createRedisClient("reaper");

startMetricsServer(Number(process.env.REAPER_METRICS_PORT) || 9102, "reaper");

async function scan() {
  const processingJobs = await redis.lrange(config.queues.processing, 0, -1);
  if (processingJobs.length === 0) return;

  const timestamps = await redis.hgetall(config.processingTimestamps);
  const now = Date.now();

  for (const raw of processingJobs) {
    const job = JSON.parse(raw);
    const claimedAt = Number(timestamps[job.job_id]);
    if (!claimedAt) continue;

    const age = now - claimedAt;
    if (age > config.processingTimeoutMs) {
      const removed = await redis.lrem(config.queues.processing, 1, raw);
      if (removed === 1) {
        await redis.hdel(config.processingTimestamps, job.job_id);
        await redis.lpush(config.queues.main, raw);
        jobsReapedTotal.inc();
        logger.warn({ job_id: job.job_id, ageMs: age }, "zombie job recovered by Reaper");
      }
    }
  }
}

async function loop() {
  logger.info(`Reaper started, scanning every ${config.reaperScanIntervalMs}ms`);
  while (true) {
    try {
      await scan();
    } catch (err) {
      logger.error({ err: err.message }, "reaper scan failed");
    }
    await new Promise((r) => setTimeout(r, config.reaperScanIntervalMs));
  }
}

loop();