import { z } from "zod";

export const jobSchema = z.object({
  idempotency_key: z.string().min(1).max(200),
  job_type: z.enum(["standard", "llm_task"]).default("standard"),
  priority: z.number().int().min(1).max(10).default(5),
  payload: z.record(z.any()).refine((v) => JSON.stringify(v).length <= 32_000, {
    message: "payload too large (max 32KB)",
  }),
});

export function validateJob(body) {
  return jobSchema.safeParse(body);
}