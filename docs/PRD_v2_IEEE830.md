## 5. Functional Requirements (IEEE 830 Format)

| ID    | Requirement                                                       | Acceptance Criteria                                                                                                                                        |
| ----- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | System shall enforce rate limiting at the API Gateway             | Requests exceeding 100/min per IP receive HTTP 429                                                                                                         |
| FR-02 | System shall validate all job submissions against a strict schema | Malformed payloads receive HTTP 400 with field-level error detail                                                                                          |
| FR-03 | System shall atomically claim jobs using Redis LMOVE              | Load test with 2+ concurrent workers shows 0 double-claims across 500+ jobs                                                                                |
| FR-04 | System shall enforce idempotency via unique idempotency keys      | Duplicate idempotency_key submissions receive HTTP 409; retried jobs produce 0 duplicate side effects                                                      |
| FR-05 | System shall retry failed jobs with exponential backoff           | Retry delays follow 1s→5s→30s→60s→120s sequence, verified via timestamp logs                                                                               |
| FR-06 | System shall move jobs to DLQ after exceeding max retry count     | Jobs failing 6 consecutive attempts (default max_retries=5) appear in DLQ with dlq_reason field                                                            |
| FR-07 | System shall recover zombie jobs via the Reaper Service           | Jobs claimed but not completed within processing_timeout_ms are auto-recovered and re-queued within one reaper scan interval                               |
| FR-08 | System shall support an LLM/RAG job type alongside standard jobs  | job_type="llm_task" retrieves relevant context from the knowledge base and returns an LLM-generated, context-grounded answer                               |
| FR-09 | System shall protect external API calls with a circuit breaker    | After error threshold is exceeded, breaker opens and subsequent calls fail fast without invoking the external API                                          |
| FR-10 | System shall encrypt sensitive payload fields at rest             | Fields in the sensitive-fields list (email, phone, ssn, credit_card, raw_query) are stored as AES-256-GCM ciphertext, verified via direct Redis inspection |
| FR-11 | System shall expose Prometheus-compatible metrics per service     | GET /metrics on each service returns valid Prometheus exposition format including custom reliablequeue_* metrics                                           |
| FR-12 | System shall emit structured, trace-correlated logs               | Every log line includes a trace_id; a single job's logs can be correlated across gateway, worker, scheduler via that trace_id                              |

## 6. Non-Functional Requirements (IEEE 830 Format)

| ID     | Requirement                                                              | Acceptance Criteria                                                                                        |
| ------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| NFR-01 | p99 job pickup latency shall remain under 200ms at 2-worker scale        | Measured via job_duration_seconds histogram under load test                                                |
| NFR-02 | System shall guarantee at-least-once delivery with idempotent processing | 0 duplicate side-effects across 500+ job load test with simulated worker crashes                           |
| NFR-03 | System shall persist Redis data across restarts                          | AOF persistence enabled; data survives `docker compose restart`                                            |
| NFR-04 | All Redis connections from application services shall use TLS 1.2+       | Verified via redis-cli --tls connection and Docker logs showing "Ready to accept connections tls"          |
| NFR-05 | Sensitive data at rest shall use AES-256-GCM encryption                  | Verified via direct Redis LRANGE inspection showing ciphertext, not plaintext                              |
| NFR-06 | All API input shall be schema-validated before processing                | Verified via FR-02 acceptance criteria                                                                     |
| NFR-07 | System shall be horizontally scalable at the worker layer                | Multiple worker processes can run concurrently against the same queue without data races (proven by FR-03) |
