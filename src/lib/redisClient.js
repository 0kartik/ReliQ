import Redis from "ioredis";
import fs from "fs";
import { config } from "../config.js";
import { logger } from "./logger.js";

export function createRedisClient(label = "redis") {
  const baseOptions = {
    host: config.redis.host,
    password: config.redis.password,
    maxRetriesPerRequest: 3,
  };

  let options;
  if (process.env.NODE_ENV === "production") {
    // Upstash: managed TLS, no custom certs needed
    options = { ...baseOptions, port: config.redis.port, tls: {} };
  } else if (config.redisTls.enabled) {
    options = {
      ...baseOptions,
      port: config.redisTls.port,
      tls: {
        ca: fs.readFileSync(config.redisTls.caPath),
        cert: fs.readFileSync(config.redisTls.certPath),
        key: fs.readFileSync(config.redisTls.keyPath),
        servername: "redis",
        rejectUnauthorized: true,
      },
    };
  } else {
    options = { ...baseOptions, port: config.redis.port };
  }

  const client = new Redis(options);

  client.on("connect", () =>
    logger.info(`[${label}] connected to Redis (TLS: ${config.redisTls.enabled})`)
  );
  client.on("error", (err) => logger.error({ err }, `[${label}] Redis error`));

  return client;
}