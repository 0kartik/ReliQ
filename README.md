# ReliableQueue (ReliQ)

A fault-tolerant, event-driven job processing pipeline with guaranteed delivery - built for OneInbox AI Internship Hackathon 2026, Problem Statement 6 (Backend Developer track).

**Live demo:** https://reliablequeue-gateway.onrender.com

**Problem Statement:** PS6 - Event-Driven Pipeline with Guaranteed Delivery

---

## What this is

ReliableQueue processes asynchronous jobs - including LLM/RAG tasks - with three hard guarantees:

1. **Zero job loss**, even if a worker crashes mid-processing
2. **Zero duplicate side-effects**, even when jobs are retried
3. **Full observability** into every job's lifecycle

It combines atomic Redis operations, idempotency enforcement, exponential backoff, dead-lettering, and a self-healing Reaper service - proven under a 500-job load test with a simulated worker crash (see [Load Test Results](#load-test-results) below).

**Flow:** Client → Gateway (auth, rate limit, schema validation) → Producer → Redis Queue (atomic `LMOVE` claim) → Worker Pool → Success, or Retry Queue (exponential backoff) → Dead Letter Queue after max retries. A Reaper service continuously recovers zombie jobs from crashed workers. All services expose Prometheus metrics and structured, trace-correlated logs.

## Features

| Category            | Implementation                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Atomic job claiming | Redis `LMOVE` - guarantees no two workers ever claim the same job                         |
| Idempotency         | Redis-backed idempotency store, enforced at both gateway and worker                       |
| Retry with backoff  | Redis Sorted Set, exponential delays (1s → 5s → 30s → 60s → 120s)                         |
| Dead-letter queue   | Jobs exceeding max retries quarantined for inspection, with Slack alerting                |
| Zombie recovery     | Reaper service detects and recovers jobs from crashed workers                             |
| LLM/RAG integration | Retrieval-augmented generation job type (Gemini), circuit-breaker protected               |
| Circuit breaker     | Opossum-based, protects the pipeline from a failing LLM dependency                        |
| Observability       | Prometheus metrics, OpenTelemetry tracing, structured JSON logs (Loki-ready)              |
| Security            | TLS on Redis connections, AES-256-GCM field-level encryption, API key auth, rate limiting |
| Live dashboard      | Real-time queue depth, job history, and one-click demo triggers                           |

## Tech stack

Node.js, Express, ioredis, Redis (Upstash in production), Google Gemini (OpenAI-compatible endpoint), Opossum (circuit breaker), Prometheus (`prom-client`), OpenTelemetry, Pino (structured logging), Zod (schema validation).

## Getting started (local)

```bash
git clone https://github.com/0kartik/ReliQ
cd ReliQ
npm install
cp .env.example .env   # fill in your own Gemini key, AES key, etc.
docker compose up -d   # starts local Redis
npm run dev             # runs gateway + worker + scheduler + reaper + a live job generator
```

Open `http://localhost:3000` for the live dashboard.

## Running tests

```bash
npm run lint
npm run test
```

CI runs both automatically on every push via GitHub Actions (see `.github/workflows/ci.yml`).

## Load Test Results

500 jobs submitted across 2 concurrent workers, with one worker force-killed mid-run to simulate a real crash.

| Metric                      | Result                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Jobs submitted              | 500                                                                                       |
| Jobs completed exactly once | 500                                                                                       |
| Duplicate side-effects      | 0                                                                                         |
| Jobs lost                   | 0                                                                                         |
| Jobs in DLQ                 | 0                                                                                         |
| Worker crash recovery       | Confirmed - Reaper detected and recovered the zombie job, replacement worker completed it |

Full report: [`loadtest-report.md`](./loadtest-report.md)

## Known limitations & roadmap

This was built end-to-end in ~10 days for a hackathon. Given more time, next priorities would be:

- Expanded test coverage (current suite covers idempotency/security/schema/retry-boundary logic; would add full integration tests against a live Redis instance in CI)
- Kubernetes deployment (currently Docker Compose locally, Render in production)
- Full Grafana/Jaeger/Loki stack (currently Prometheus + console-exported traces + structured JSON logs, which are compatible with but not yet wired into a full observability stack)
- Secrets management via a dedicated vault instead of environment variables

## Project Structure

```text
src/
├── gateway/          → HTTP API Layer
│   ├── Authentication
│   ├── Rate Limiting
│   └── Schema Validation
│
├── producer/         → Creates and enqueues jobs
│
├── worker/           → Processes jobs
│   ├── Atomic Claim
│   ├── Idempotency
│   └── LLM / RAG Handler
│
├── retry/            → Exponential backoff scheduler
├── reaper/           → Recovers zombie jobs
│
├── lib/              → Shared modules
│   ├── Redis Client
│   ├── Logger
│   ├── Metrics
│   ├── Tracing
│   └── Security
│
├── tests/            → Unit tests
├── scripts/          → Load testing utilities
└── public/           → Live monitoring dashboard
```

## Author

Janardan Kartikeya Agnihotram - [GitHub](https://github.com/0kartik) · janardanagnihotram@gmail.com
