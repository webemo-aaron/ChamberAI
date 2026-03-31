/**
 * Kiosk RAG (Retrieval-Augmented Generation) with embeddings
 * In-process vector store with cosine similarity search
 * Integrates with Vercel AI SDK for embedding generation
 */

import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";
import { fetchAllIndexableDocuments } from "./kiosk-context.js";
import { buildContext } from "./kiosk-context.js";

/**
 * Module-level singleton: in-memory embedding cache
 * Map<docId, { text: string, embedding: Float32Array, metadata: object }>
 */
export const embeddingCache = new Map();

/**
 * Cosine similarity between two vectors
 * @param {number[]|Float32Array} a - Vector A
 * @param {number[]|Float32Array} b - Vector B
 * @returns {number} - Cosine similarity score (-1 to 1)
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Format a Firestore document for embedding
 * @param {object} doc - Document with { id, type, rawData }
 * @returns {string} - Formatted text for embedding
 */
export function buildDocumentText(doc) {
  const { type, rawData } = doc;

  switch (type) {
    case "meeting":
      const meetingDate = rawData.timestamp
        ? new Date(rawData.timestamp).toISOString().split("T")[0]
        : "Unknown date";
      const summary = rawData.public_summary || rawData.publicSummary || "";
      return `${rawData.title || "Meeting"} on ${meetingDate}: ${rawData.attendees?.length || 0} attendees. ${summary}`;

    case "motion":
      return `Motion: ${rawData.title || "Untitled"} — Status: ${rawData.status || "unknown"}, Votes Yes/No: ${rawData.votesYes || 0}/${rawData.votesNo || 0}`;

    case "action_item":
      const dueDate = rawData.dueDate
        ? new Date(rawData.dueDate).toISOString().split("T")[0]
        : "No due date";
      return `Action item: ${rawData.title || "Untitled"}. ${rawData.description || ""} — Assigned: ${rawData.assignee || "Unassigned"}, Due: ${dueDate}`;

    case "business_listing":
      return `${rawData.name || "Business"} in ${rawData.city || "Unknown"}: ${rawData.description || ""}`;

    default:
      return "";
  }
}

/**
 * Rebuild the embedding index from Firestore
 * Fetches all documents, generates embeddings, populates cache
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {string} apiKey - OpenAI API key
 * @param {string} dataScope - 'public' or 'private'
 * @returns {Promise<{ documentsIndexed: number, tokensUsed: number }>}
 */
export async function rebuildEmbeddingIndex(db, orgId, apiKey, dataScope = "public") {
  // Fetch all indexable documents
  const documents = await fetchAllIndexableDocuments(db, orgId, dataScope);

  if (documents.length === 0) {
    console.warn(`No documents to index for org ${orgId}`);
    return { documentsIndexed: 0, tokensUsed: 0 };
  }

  // Build text for each document
  const docTexts = documents.map((doc) => buildDocumentText(doc));

  try {
    // Generate embeddings via Vercel AI SDK
    const result = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: docTexts
    });

    // Clear and repopulate cache
    embeddingCache.clear();
    let totalTokens = 0;

    result.embeddings.forEach((embedding, index) => {
      const doc = documents[index];
      const text = docTexts[index];
      embeddingCache.set(doc.id, {
        text,
        embedding: new Float32Array(embedding),
        metadata: {
          type: doc.type,
          orgId
        }
      });
    });

    // Token usage (assume embeddings endpoint reports it)
    if (result.usage) {
      totalTokens = result.usage.tokens ?? 0;
    }

    console.log(`Indexed ${documents.length} documents for org ${orgId}`);
    return {
      documentsIndexed: documents.length,
      tokensUsed: totalTokens
    };
  } catch (error) {
    console.error("Failed to rebuild embedding index:", error.message);
    throw error;
  }
}

/**
 * Search embeddings by query text
 * Returns top-K most similar documents (cosine similarity)
 * @param {string} queryText - Query text
 * @param {string} apiKey - OpenAI API key
 * @param {number} topK - Number of top results to return (default: 5)
 * @returns {Promise<Array>} - Array of { id, text, score, metadata }
 */
export async function searchEmbeddings(queryText, apiKey, topK = 5) {
  if (embeddingCache.size === 0) {
    return [];
  }

  try {
    // Generate query embedding
    const queryEmbedding = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: queryText
    });

    // Compute similarities with all cached documents
    const similarities = [];
    for (const [id, cached] of embeddingCache.entries()) {
      const score = cosineSimilarity(queryEmbedding.embedding, cached.embedding);
      similarities.push({
        id,
        text: cached.text,
        score,
        metadata: cached.metadata
      });
    }

    // Sort by descending similarity and return top-K
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch (error) {
    console.error("Failed to search embeddings:", error.message);
    return [];
  }
}

/**
 * Estimate tokens for RAG context
 * @param {string} text - Text to count
 * @returns {number} - Estimated token count
 */
function estimateRagTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length * 0.25); // 4 chars per token
}

/**
 * Build context using RAG (semantic search)
 * Orchestrates: ensure index is warm → search → format context
 * Falls back to recency-based buildContext if RAG fails
 * @param {FirebaseFirestore.Firestore} db - Firestore instance
 * @param {string} orgId - Organization ID
 * @param {object} config - Context configuration
 * @param {string} userMessage - User query for semantic search
 * @param {string} apiKey - OpenAI API key for embeddings
 * @returns {Promise<{context: string, sources: object, estimatedTokens: number, ragUsed: boolean}>}
 */
export async function buildRagContext(db, orgId, config, userMessage, apiKey) {
  try {
    // Ensure embedding cache is warm
    if (embeddingCache.size === 0) {
      await rebuildEmbeddingIndex(db, orgId, apiKey, config.dataScope);
    }

    // Search for semantically relevant documents
    const topK = config.contextConfig?.ragTopK ?? 5;
    const searchResults = await searchEmbeddings(userMessage, apiKey, topK);

    if (searchResults.length === 0) {
      // No RAG results, fall back to recency-based
      const fallback = await buildContext(db, orgId, config);
      return { ...fallback, ragUsed: false };
    }

    // Format RAG results into context
    let contextStr = "## Relevant Context (Semantic Search)\n";
    let usedTokens = 0;
    const tokenLimit = config.tokenLimit ?? 8000;
    const sources = {
      rag: {
        method: "semantic_search",
        topK: searchResults.length,
        scores: searchResults.map((r) => r.score)
      }
    };

    for (const result of searchResults) {
      const section = `- ${result.text}\n`;
      const sectionTokens = estimateRagTokens(section);

      if (usedTokens + sectionTokens <= tokenLimit) {
        contextStr += section;
        usedTokens += sectionTokens;
      } else {
        break; // Token budget exceeded
      }
    }

    // Append some recency-based context for completeness
    try {
      const recentContext = await buildContext(db, orgId, {
        ...config,
        meetingsLimit: 2, // Just 2 recent for supplementary context
        motionsLimit: 2,
        actionItemsLimit: 2
      });

      if (usedTokens + recentContext.estimatedTokens <= tokenLimit) {
        contextStr += "\n## Additional Recent Context\n" + recentContext.context;
        usedTokens += recentContext.estimatedTokens;
        sources.recent = recentContext.sources;
      }
    } catch (_err) {
      // OK to skip recent if it fails
    }

    return {
      context: contextStr || "No context available.",
      sources,
      estimatedTokens: usedTokens,
      ragUsed: true
    };
  } catch (error) {
    console.error("RAG context build failed, falling back to recency:", error.message);
    // Graceful fallback to recency-based context
    const fallback = await buildContext(db, orgId, config);
    return { ...fallback, ragUsed: false };
  }
}
