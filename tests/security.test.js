import { test } from "node:test";
import assert from "node:assert";
import { encryptField, decryptField, encryptSensitivePayloadFields, decryptSensitivePayloadFields } from "../src/lib/security.js";
import "dotenv/config";

// Requires AES_ENCRYPTION_KEY to be set in env before running tests
test("encryptField and decryptField round-trip correctly", () => {
  const plaintext = "sensitive-value-123";
  const encrypted = encryptField(plaintext);
  assert.notStrictEqual(encrypted, plaintext);
  const decrypted = decryptField(encrypted);
  assert.strictEqual(decrypted, plaintext);
});

test("encryptField produces different ciphertext each time (random IV)", () => {
  const plaintext = "same-value";
  const encrypted1 = encryptField(plaintext);
  const encrypted2 = encryptField(plaintext);
  assert.notStrictEqual(encrypted1, encrypted2);
});

test("encryptSensitivePayloadFields only encrypts listed fields", () => {
  const payload = { email: "a@b.com", task: "not-sensitive" };
  const result = encryptSensitivePayloadFields(payload);
  assert.strictEqual(result.email.__encrypted, true);
  assert.strictEqual(result.task, "not-sensitive");
});

test("decryptSensitivePayloadFields reverses encryption correctly", () => {
  const payload = { email: "test@example.com", task: "demo" };
  const encrypted = encryptSensitivePayloadFields(payload);
  const decrypted = decryptSensitivePayloadFields(encrypted);
  assert.strictEqual(decrypted.email, "test@example.com");
  assert.strictEqual(decrypted.task, "demo");
});