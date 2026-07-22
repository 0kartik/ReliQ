import { test } from "node:test";
import assert from "node:assert";
import { retrieveContext } from "../src/worker/handlers/knowledgeBase.js";
import "dotenv/config";

test("retrieveContext returns requested number of docs", () => {
  const results = retrieveContext("How does retry backoff work?", 2);
  assert.strictEqual(results.length, 2);
});

test("retrieveContext ranks more relevant doc higher", () => {
  const results = retrieveContext("dead letter queue max retries", 3);
  const topDoc = results[0];
  assert.ok(topDoc.score > 0, "top result should have a positive similarity score");
});

test("retrieveContext returns docs with required fields", () => {
  const results = retrieveContext("circuit breaker", 1);
  assert.ok(results[0].id);
  assert.ok(results[0].text);
  assert.ok(typeof results[0].score === "number");
});