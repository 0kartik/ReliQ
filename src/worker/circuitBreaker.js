import CircuitBreaker from "opossum";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

export function wrapWithCircuitBreaker(fn, name) {
  const breaker = new CircuitBreaker(fn, {
    timeout: config.circuitBreaker.timeoutMs,
    errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
    resetTimeout: config.circuitBreaker.resetTimeoutMs,
  });

  breaker.on("open", () => logger.error(`[circuit:${name}] OPEN — calls will fail fast`));
  breaker.on("halfOpen", () => logger.warn(`[circuit:${name}] HALF-OPEN — testing recovery`));
  breaker.on("close", () => logger.info(`[circuit:${name}] CLOSED — normal operation resumed`));
  breaker.on("timeout", () => logger.error(`[circuit:${name}] call timed out`));
  breaker.on("reject", () => logger.warn(`[circuit:${name}] call rejected — circuit is open`));

  return breaker;
}