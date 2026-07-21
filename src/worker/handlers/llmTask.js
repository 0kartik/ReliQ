import OpenAI from "openai";
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { retrieveContext } from "./knowledgeBase.js";
import { wrapWithCircuitBreaker } from "../circuitBreaker.js";

const openai = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseURL,
});

async function callLLM(query, context) {
  const contextText = context.map((c, i) => `[${i + 1}] ${c.text}`).join("\n");

  const response = await openai.chat.completions.create({
    model: config.llm.model,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Answer the question using ONLY the context below. Be concise (2-3 sentences).\n\nContext:\n${contextText}\n\nQuestion: ${query}`,
      },
    ],
  });

  return response.choices[0].message.content;
}

const llmBreaker = wrapWithCircuitBreaker(callLLM, "llm-api");

export async function handleLLMTask(job) {
  const query = job.payload.query;
  if (!query) {
    throw new Error("llm_task job requires payload.query");
  }

  logger.info({ job_id: job.job_id, query }, "retrieving context for RAG job");
  const context = retrieveContext(query, 2);

  logger.info(
    { job_id: job.job_id, matchedDocs: context.map((c) => c.id) },
    "calling LLM with retrieved context"
  );

  const answer = await llmBreaker.fire(query, context);

  logger.info({ job_id: job.job_id }, "LLM job completed");

  return {
    success: true,
    query,
    retrieved_docs: context.map((c) => ({ id: c.id, score: c.score.toFixed(3) })),
    answer,
  };
}