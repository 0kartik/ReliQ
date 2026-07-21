import { config } from "../config.js";

export async function markProcessing(redis, key) {
  await redis.set(config.idempotency.prefix + key, "processing", "EX", config.idempotency.ttlSeconds);
}

export async function markCompleted(redis, key) {
  await redis.set(config.idempotency.prefix + key, "completed", "EX", config.idempotency.ttlSeconds);
}

export async function getStatus(redis, key) {
  return redis.get(config.idempotency.prefix + key);
}