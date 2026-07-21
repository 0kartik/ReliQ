import crypto from "crypto";
import { config } from "../config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey() {
  const keyHex = config.security.aesKey;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("AES_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

// Encrypts a string, returns a single base64 blob containing iv + authTag + ciphertext
export function encryptField(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptField(blobBase64) {
  const key = getKey();
  const blob = Buffer.from(blobBase64, "base64");

  const iv = blob.subarray(0, IV_LENGTH);
  const authTag = blob.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = blob.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// Encrypts specific fields in a job payload before it's queued.
// Add field names here that should be encrypted at rest (PII, secrets, etc.)
const SENSITIVE_FIELDS = ["email", "phone", "ssn", "credit_card", "raw_query"];

export function encryptSensitivePayloadFields(payload) {
  const result = { ...payload };
  for (const field of SENSITIVE_FIELDS) {
    if (result[field] !== undefined) {
      result[field] = { __encrypted: true, value: encryptField(result[field]) };
    }
  }
  return result;
}

export function decryptSensitivePayloadFields(payload) {
  const result = { ...payload };
  for (const field of SENSITIVE_FIELDS) {
    if (result[field]?.__encrypted) {
      result[field] = decryptField(result[field].value);
    }
  }
  return result;
}