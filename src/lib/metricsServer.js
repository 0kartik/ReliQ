import express from "express";
import { register } from "./metrics.js";
import { logger } from "./logger.js";

export function startMetricsServer(port, serviceName) {
  const app = express();
  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });
  app.get("/health", (_req, res) => res.json({ status: "ok", service: serviceName }));
  app.listen(port, () => logger.info(`[${serviceName}] metrics server on :${port}/metrics`));
}