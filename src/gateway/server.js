import "../lib/tracing.js"; // must be imported first to instrument correctly
import express from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";
import { logger, withTrace } from "../lib/logger.js";
import { createRedisClient } from "../lib/redisClient.js";
import { validateJob } from "./schemas.js";
import { enqueueJob } from "../producer/producer.js";
import { register } from "../lib/metrics.js";
import { tracer, getTraceId } from "../lib/tracing.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json({ limit: "64kb" }));

const redis = createRedisClient("gateway");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../../public")));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded", detail: "Max 100 requests/min" },
  skip: (req) => req.headers["x-loadtest-bypass"] === process.env.LOADTEST_BYPASS_SECRET,
});
app.use("/v1/jobs", limiter);

function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: "unauthorized", detail: "Missing or invalid x-api-key header" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/v1/jobs", requireApiKey, async (req, res) => {
  const span = tracer.startSpan("gateway.accept_job");
  const traceId = getTraceId(span);

  try {
    const parsed = validateJob(req.body);
    if (!parsed.success) {
      span.setAttribute("validation.failed", true);
      span.end();
      return res.status(400).json({
        error: "validation_failed",
        details: parsed.error.flatten(),
        trace_id: traceId,
      });
    }

    const result = await enqueueJob(redis, parsed.data);
    span.setAttribute("job.accepted", result.accepted);

    if (!result.accepted) {
      logger.warn(withTrace(traceId, { reason: result.reason }), "job rejected — duplicate");
      span.end();
      return res.status(409).json({
        error: result.reason,
        detail: "A job with this idempotency_key was already accepted",
        existing_status: result.existing_status,
        trace_id: traceId,
      });
    }

    logger.info(withTrace(traceId, { job_id: result.job_id }), "job accepted and queued");
    span.end();
    return res.status(202).json({ job_id: result.job_id, status: "queued", trace_id: traceId });
  } catch (err) {
    span.recordException(err);
    span.end();
    throw err;
  }
});

app.get("/status", async (_req, res) => {
  const [main, processing, dlqLen, retry, recentRaw, dlqRaw] = await Promise.all([
    redis.llen(config.queues.main),
    redis.llen(config.queues.processing),
    redis.llen(config.queues.dlq),
    redis.zcard(config.queues.retry),
    redis.lrange("recent:jobs", 0, 19),
    redis.lrange(config.queues.dlq, 0, 9),
  ]);

  res.json({
    queues: { main, processing, dlq: dlqLen, retry },
    recent_jobs: recentRaw.map((r) => JSON.parse(r)),
    dlq_sample: dlqRaw.map((r) => JSON.parse(r)),
    timestamp: new Date().toISOString(),
  });
});

app.post("/demo/submit-standard", requireApiKey, async (_req, res) => {
  const key = `demo-standard-${Date.now()}`;
  global.__lastDemoKey = key;
  const job = {
    idempotency_key: key,
    job_type: "standard",
    priority: 5,
    payload: { task: "dashboard-demo-job", email: "demo@example.com" },
  };
  const result = await enqueueJob(redis, job);
  res.json(result);
});

app.post("/demo/submit-llm", requireApiKey, async (_req, res) => {
  const queries = [
    "How does ReliableQueue prevent duplicate job processing?",
    "What happens when a worker crashes mid-job?",
    "How does the circuit breaker protect the LLM API?",
  ];
  const job = {
    idempotency_key: `demo-llm-${Date.now()}`,
    job_type: "llm_task",
    priority: 5,
    payload: { query: queries[Math.floor(Math.random() * queries.length)] },
  };
  const result = await enqueueJob(redis, job);
  res.json(result);
});

app.post("/demo/submit-duplicate", requireApiKey, async (_req, res) => {
  // Reuses the last known demo key on purpose, to visibly trigger a 409
  const key = global.__lastDemoKey || "demo-standard-none-yet";
  const job = { idempotency_key: key, job_type: "standard", priority: 5, payload: { task: "duplicate-test" } };
  const result = await enqueueJob(redis, job);
  res.json(result);
});

app.listen(config.gatewayPort, () => {
  logger.info(`Gateway listening on port ${config.gatewayPort}`);
});