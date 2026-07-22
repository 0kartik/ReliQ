import "dotenv/config";

export const config = {
  redis: {
    host:
      process.env.NODE_ENV === "production"
        ? process.env.REDIS_PROD_HOST
        : process.env.REDIS_HOST || "127.0.0.1",
    port:
      process.env.NODE_ENV === "production"
        ? Number(process.env.REDIS_PROD_PORT)
        : Number(process.env.REDIS_PORT) || 6379,
    password:
      process.env.NODE_ENV === "production"
        ? process.env.REDIS_PROD_PASSWORD
        : process.env.REDIS_PASSWORD || "devpassword123",
  },
  gatewayPort: Number(process.env.GATEWAY_PORT) || 3000,
  queues: {
    main: process.env.QUEUE_MAIN || "queue:main",
    processing: process.env.QUEUE_PROCESSING || "queue:processing",
    retry: process.env.QUEUE_RETRY || "queue:retry",
    dlq: process.env.QUEUE_DLQ || "queue:dlq",
  },
  processingTimestamps: process.env.PROCESSING_TIMESTAMPS || "processing:timestamps",
  idempotency: {
    prefix: process.env.IDEMPOTENCY_PREFIX || "idem:",
    ttlSeconds: Number(process.env.IDEMPOTENCY_TTL_SECONDS) || 86400,
  },
  retry: {
    maxRetries: Number(process.env.MAX_RETRIES) || 5,
    backoffMs: [1000, 5000, 30000, 60000, 120000],
  },
  processingTimeoutMs: Number(process.env.PROCESSING_TIMEOUT_MS) || 15000,
  reaperScanIntervalMs: Number(process.env.REAPER_SCAN_INTERVAL_MS) || 5000,
  schedulerPollIntervalMs: Number(process.env.SCHEDULER_POLL_INTERVAL_MS) || 1000,
  llm: {
    apiKey: process.env.FEATHERLESS_API_KEY,
    model: process.env.LLM_MODEL,
    baseURL: "https://api.featherless.ai/v1",
  },
  circuitBreaker: {
    timeoutMs: Number(process.env.CIRCUIT_BREAKER_TIMEOUT_MS) || 10000,
    errorThresholdPercentage: Number(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 50,
    resetTimeoutMs: Number(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT_MS) || 15000,
  },
  redisTls: {
    enabled: process.env.REDIS_TLS_ENABLED === "true",
    port: Number(process.env.REDIS_TLS_PORT) || 6380,
    caPath: process.env.REDIS_TLS_CA_PATH,
    certPath: process.env.REDIS_TLS_CERT_PATH,
    keyPath: process.env.REDIS_TLS_KEY_PATH,
  },
  security: {
    aesKey: process.env.AES_ENCRYPTION_KEY,
  },
  alerting: {
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || null,
  },
};
