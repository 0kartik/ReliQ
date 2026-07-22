import client from "prom-client";

export const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const jobsProcessedTotal = new client.Counter({
  name: "reliablequeue_jobs_processed_total",
  help: "Total jobs successfully processed",
  labelNames: ["job_type"],
  registers: [register],
});

export const jobsFailedTotal = new client.Counter({
  name: "reliablequeue_jobs_failed_total",
  help: "Total job processing failures",
  labelNames: ["job_type"],
  registers: [register],
});

export const jobsRetriedTotal = new client.Counter({
  name: "reliablequeue_jobs_retried_total",
  help: "Total jobs sent to retry queue",
  labelNames: ["job_type"],
  registers: [register],
});

export const jobsDlqTotal = new client.Counter({
  name: "reliablequeue_jobs_dlq_total",
  help: "Total jobs moved to dead-letter queue",
  labelNames: ["job_type"],
  registers: [register],
});

export const jobsReapedTotal = new client.Counter({
  name: "reliablequeue_jobs_reaped_total",
  help: "Total zombie jobs recovered by the Reaper",
  registers: [register],
});

export const jobDurationSeconds = new client.Histogram({
  name: "reliablequeue_job_duration_seconds",
  help: "Job processing duration in seconds",
  labelNames: ["job_type"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const queueDepthGauge = new client.Gauge({
  name: "reliablequeue_queue_depth",
  help: "Current number of jobs in a given queue",
  labelNames: ["queue"],
  registers: [register],
});
