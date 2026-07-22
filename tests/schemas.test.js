import { test } from "node:test";
import assert from "node:assert";
import { validateJob } from "../src/gateway/schemas.js";
import "dotenv/config";

test("accepts a valid standard job", () => {
  const result = validateJob({
    idempotency_key: "test-key-1",
    job_type: "standard",
    priority: 5,
    payload: { task: "demo" },
  });
  assert.strictEqual(result.success, true);
});

test("rejects job missing idempotency_key", () => {
  const result = validateJob({ job_type: "standard", payload: { task: "demo" } });
  assert.strictEqual(result.success, false);
});

test("rejects invalid job_type", () => {
  const result = validateJob({
    idempotency_key: "test-key-2",
    job_type: "not_a_real_type",
    payload: {},
  });
  assert.strictEqual(result.success, false);
});

test("defaults priority to 5 when omitted", () => {
  const result = validateJob({
    idempotency_key: "test-key-3",
    job_type: "standard",
    payload: {},
  });
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.data.priority, 5);
});

test("rejects oversized payload (>32KB)", () => {
  const bigString = "x".repeat(40_000);
  const result = validateJob({
    idempotency_key: "test-key-4",
    job_type: "standard",
    payload: { data: bigString },
  });
  assert.strictEqual(result.success, false);
});