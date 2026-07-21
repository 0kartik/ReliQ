// Tiny in-memory knowledge base for RAG demo.
// In production this would be a vector DB (pgvector, Pinecone, etc.)
const DOCS = [
  {
    id: "doc1",
    text: "ReliableQueue uses Redis LMOVE to atomically claim jobs, preventing two workers from ever processing the same job simultaneously.",
  },
  {
    id: "doc2",
    text: "Idempotency keys ensure that retried jobs never trigger duplicate side effects like double payments or duplicate notifications.",
  },
  {
    id: "doc3",
    text: "The Reaper Service scans the processing list for jobs claimed longer than the timeout threshold and recovers them if a worker crashed.",
  },
  {
    id: "doc4",
    text: "Exponential backoff retry delays (1s, 5s, 30s, 60s, 120s) prevent retry storms from overwhelming downstream services.",
  },
  {
    id: "doc5",
    text: "Jobs that exceed the maximum retry count are moved to a Dead Letter Queue for manual inspection instead of retrying forever.",
  },
  {
    id: "doc6",
    text: "Circuit breakers stop calling external APIs after repeated failures, giving the downstream service time to recover before retrying.",
  },
];

// Simple term-overlap similarity — no embedding API call needed, keeps this fast and free.
// Swap this for real embeddings (OpenAI text-embedding-3-small) if you have time on Day 6.
function scoreSimilarity(query, docText) {
  const qWords = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
  const dWords = docText.toLowerCase().split(/\W+/).filter(Boolean);
  let overlap = 0;
  for (const w of dWords) {
    if (qWords.has(w)) overlap++;
  }
  return overlap / Math.sqrt(dWords.length);
}

export function retrieveContext(query, topK = 2) {
  const scored = DOCS.map((doc) => ({ ...doc, score: scoreSimilarity(query, doc.text) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return scored;
}