import { logger } from "../../lib/logger.js";

export async function handleStandardJob(job) {
  logger.info({ job_id: job.job_id }, "processing standard job");
  // Simulate real work — replace with actual business logic
  await new Promise((r) => setTimeout(r, 300));
  return { success: true, result: `processed:${job.job_id}` };
}
