# 🚀 ReliQ - AI Powered Reliable Queue System

> **Enterprise-grade distributed job queue with AI task processing, fault tolerance, retries, dead-letter queues, observability, and secure data handling.**

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Redis](https://img.shields.io/badge/Redis-TLS-red)
![Express](https://img.shields.io/badge/Express.js-black)
![OpenAI](https://img.shields.io/badge/AI-LLM-blue)
---

# 📌 Problem Statement

Modern applications rely heavily on asynchronous job processing for AI inference, notifications, report generation, document processing, image analysis, and background workflows. Traditional queue systems often struggle with worker crashes, duplicate execution, lost jobs, and limited observability.

**ReliQ** is a production-inspired distributed queue system designed to execute AI-powered workloads reliably, securely, and efficiently.

---

# ✨ Features

## 🤖 AI Job Processing

- AI/LLM task execution
- Context-aware request processing
- Structured AI responses
- Supports RAG-based workflows

---

## ⚡ Reliable Queue

- Atomic job claiming
- Distributed workers
- High concurrency
- At-least-once delivery
- Idempotent processing

---

## 🔄 Automatic Retry

Failed jobs are retried automatically using exponential backoff.

```
Job Failed
     │
     ▼
Retry #1 (1s)
     │
Retry #2 (5s)
     │
Retry #3 (30s)
     │
Retry #4 (60s)
     │
Retry #5 (120s)
     │
     ▼
Dead Letter Queue
```

---

## ☠️ Dead Letter Queue

Jobs that exceed retry limits are safely moved into a Dead Letter Queue (DLQ) for later inspection instead of being lost.

---

## 🛡 Worker Recovery

If a worker crashes while processing a job,

ReliQ automatically:

- Detects abandoned jobs
- Recovers unfinished tasks
- Requeues them safely

No manual intervention required.

---

## 🔐 Security

- Redis TLS Encryption
- AES-256-GCM Payload Encryption
- Zod Schema Validation
- API Rate Limiting
- Secure Request Validation

---

## 📈 Observability

- Prometheus Metrics
- Structured Logging
- Trace IDs
- Queue Monitoring
- Performance Analytics

---

## 💪 Fault Tolerance

- Circuit Breaker
- Retry Scheduler
- Worker Reaper
- Failure Isolation
- Duplicate Prevention

---

# 🏗 Architecture

```text
                  Client
                     │
                     ▼
              API Gateway
                     │
       Request Validation
                     │
        Rate Limiting
                     │
             Redis Queue
          ┌──────────────┐
          │              │
          ▼              ▼
      Worker 1       Worker 2
          │              │
          └──────┬───────┘
                 ▼
            AI / LLM API
                 │
        Successful Job
                 │
                 ▼
          Completed Queue

           Failed Jobs
                │
                ▼
        Retry Scheduler
                │
                ▼
      Dead Letter Queue

Worker Crash
      │
      ▼
 Reaper Service
      │
      ▼
 Job Requeued
```

---

# 🛠 Tech Stack

| Category | Technology |
|-----------|------------|
| Backend | Node.js |
| Framework | Express.js |
| Queue | Redis |
| Validation | Zod |
| AI | OpenAI API |
| Monitoring | Prometheus |
| Logging | Pino |
| Security | TLS, AES-256-GCM |
| Resilience | Opossum Circuit Breaker |

---

# 📂 Project Structure

```text
ReliQ/

├── src/
│   ├── gateway/
│   ├── worker/
│   ├── retry/
│   ├── reaper/
│   ├── middleware/
│   ├── utils/
│   └── config.js
│
├── scripts/
│   ├── loadgen.js
│   └── loadtest.js
│
├── docs/
│   └── PRD_v2_IEEE830.md
│
├── docker-compose.yml
├── package.json
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/yourusername/ReliQ.git

cd ReliQ
```

## Install Dependencies

```bash
npm install
```

## Configure Environment

```bash
cp .env.example .env
```

Update the required environment variables.

---

## Start Redis

```bash
docker compose up
```

---

## Start the Project

```bash
npm run demo
```

or

```bash
npm run dev
```

---

# 📊 Performance Highlights

- ✅ Atomic queue operations
- ✅ Zero duplicate job claims
- ✅ Automatic retry handling
- ✅ Worker crash recovery
- ✅ Secure encrypted payloads
- ✅ Prometheus monitoring
- ✅ Horizontally scalable workers

---

# 🧠 Distributed Systems Concepts

ReliQ demonstrates several production-grade distributed systems principles:

- Atomic Queue Operations
- Distributed Worker Architecture
- Idempotency Keys
- Exponential Backoff
- Dead Letter Queue
- Worker Heartbeats
- Crash Recovery
- Circuit Breaker Pattern
- Secure Payload Encryption
- Rate Limiting
- Observability
- Fault Isolation

---

# 🎯 Use Cases

- AI Customer Support
- Document Intelligence
- Healthcare AI Pipelines
- Financial Background Jobs
- Notification Systems
- Image Processing
- Enterprise Workflow Automation
- Large-scale AI Task Processing

---

# 🔮 Future Roadmap

- Kubernetes Deployment
- Auto Scaling Workers
- Web Dashboard
- Queue Analytics
- Multi-region Replication
- Priority Queues
- Vector Database Integration
- Multi-Tenant Support

---