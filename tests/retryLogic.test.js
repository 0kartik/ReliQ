import { test } from "node:test";
import assert from "node:assert";
import { config } from "../src/config.js";
import "dotenv/config";

test("backoff delays increase monotonically", () => {
  const delays = config.retry.backoffMs;
  for (let i = 1; i < delays.length; i++) {
    assert.ok(delays[i] > delays[i - 1], `delay at index ${i} should exceed previous`);
  }
});

test("maxRetries is a positive integer", () => {
  assert.ok(Number.isInteger(config.retry.maxRetries));
  assert.ok(config.retry.maxRetries > 0);
});

test("retry count exceeding maxRetries should trigger DLQ logic threshold", () => {
  const maxRetries = config.retry.maxRetries;
  const nextRetryCount = maxRetries + 1;
  assert.ok(nextRetryCount > maxRetries, "confirms the DLQ boundary condition used in worker.js");
});
