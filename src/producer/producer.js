import { nanoid } from "nanoid";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { encryptSensitivePayloadFields } from "../lib/security.js";

/**
 * Producer Service
 * Owns job construction and enqueueing. The Gateway only handles
 * HTTP concerns (validation, rate limiting) and delegates here.
 */

export async function enqueueJob(redis, validatedJob) {
  const { idempotency_key, job_type, priority, payload } = validatedJob;
  const encryptedPayload = encryptSensitivePayloadFields(payload);

  // Fast pre-check: reject duplicates before doing any work
  const existing = await redis.get(config.idempotency.prefix + idempotency_key);
  if (existing) {
    return {
      accepted: false,
      reason: "duplicate_idempotency_key",
      existing_status: existing,
    };
  }

  const jobId = nanoid();
  const job = {
    job_id: jobId,
    idempotency_key,
    job_type,
    priority,
    payload: encryptedPayload,
    retry_count: 0,
    created_at: new Date().toISOString(),
  };

  // Mark accepted immediately so a near-simultaneous duplicate is rejected
  await redis.set(
    config.idempotency.prefix + idempotency_key,
    "accepted",
    "EX",
    config.idempotency.ttlSeconds
  );

  await redis.lpush(config.queues.main, JSON.stringify(job));

  logger.info({ job_id: jobId, job_type }, "[producer] job accepted and queued");

  return { accepted: true, job_id: jobId };
}
