import pino from "pino";

const format = process.env.LOG_FORMAT || "pretty";

export const logger = pino(
  format === "json"
    ? { level: process.env.LOG_LEVEL || "info" } // raw JSON, one line per event — Loki-ready
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
        level: process.env.LOG_LEVEL || "info",
      }
);

// Attach trace_id to a log call: logger.info(withTrace(traceId, { job_id }), "message")
export function withTrace(traceId, fields = {}) {
  return { trace_id: traceId, ...fields };
}