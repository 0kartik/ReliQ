import "dotenv/config";

const GATEWAY_URL = `http://localhost:${process.env.GATEWAY_PORT || 3000}`;
const INTERVAL_MS = Number(process.env.LOADGEN_INTERVAL_MS) || 3000;



const SAMPLE_QUERIES = [
  "How does ReliableQueue prevent duplicate job processing?",
  "What happens when a worker crashes mid-job?",
  "How does the retry backoff work?",
  "What triggers a job to move to the DLQ?",
  "How does the circuit breaker protect the LLM API?",
];

let counter = 0;
let lastKey = null;

function randomJob() {
  counter++;
  const isLLM = counter % 3 === 0; // every 3rd job is an LLM/RAG task
  const isDuplicate = counter % 7 === 0 && lastKey; // occasionally repeat a key to show idempotency

  const idempotency_key = isDuplicate ? lastKey : `loadgen-${Date.now()}-${counter}`;
  lastKey = idempotency_key;

  if (isLLM) {
    const query = SAMPLE_QUERIES[Math.floor(Math.random() * SAMPLE_QUERIES.length)];
    return { idempotency_key, job_type: "llm_task", priority: 5, payload: { query } };
  }

  return {
    idempotency_key,
    job_type: "standard",
    priority: Math.floor(Math.random() * 10) + 1,
    payload: { task: `demo-task-${counter}`, email: `user${counter}@example.com` },
  };
}

async function sendJob() {
  const job = randomJob();
  try {
    const res = await fetch(`${GATEWAY_URL}/v1/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(job),
      headers: { "Content-Type": "application/json", "x-api-key": process.env.API_KEY },
    });
    const data = await res.json();
    console.log(`[loadgen] ${res.status} ${job.job_type} ${job.idempotency_key} ->`, data.status || data.error);
  } catch (err) {
    console.error("[loadgen] failed to send job:", err.message);
  }
}

console.log(`[loadgen] starting — sending a job every ${INTERVAL_MS}ms to ${GATEWAY_URL}`);
setInterval(sendJob, INTERVAL_MS);
sendJob();