import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relativePath) {
  return readFileSync(
    new URL(`../../${relativePath}`, import.meta.url),
    "utf8"
  );
}

test("cosineSimilarity function is exported and calculates vector similarity", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify function exists
  assert.match(embeddingsJs, /export function cosineSimilarity/);

  // Verify it computes dot product and magnitudes
  assert.match(embeddingsJs, /dotProduct/);
  assert.match(embeddingsJs, /magnitudeA.*magnitudeB/s);
});

test("buildDocumentText formats documents by type", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify function exists
  assert.match(embeddingsJs, /export function buildDocumentText/);

  // Verify it handles multiple document types
  assert.match(embeddingsJs, /case "meeting"/);
  assert.match(embeddingsJs, /case "motion"/);
  assert.match(embeddingsJs, /case "action_item"/);
  assert.match(embeddingsJs, /case "business_listing"/);
});

test("embeddingCache is a module-level Map singleton", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify cache is exported as a Map
  assert.match(embeddingsJs, /export const embeddingCache = new Map/);
});

test("rebuildEmbeddingIndex fetches documents and generates embeddings", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify function signature
  assert.match(embeddingsJs, /export async function rebuildEmbeddingIndex/);

  // Verify it calls fetchAllIndexableDocuments
  assert.match(embeddingsJs, /fetchAllIndexableDocuments/);

  // Verify it uses embedMany from ai SDK
  assert.match(embeddingsJs, /embedMany/);
});

test("searchEmbeddings returns top-K similar documents sorted by similarity", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify function exists
  assert.match(embeddingsJs, /export async function searchEmbeddings/);

  // Verify it searches the cache
  assert.match(embeddingsJs, /embeddingCache.entries/);

  // Verify it sorts results by similarity descending
  assert.match(embeddingsJs, /sort.*b\.score - a\.score/);

  // Verify it returns top-K
  assert.match(embeddingsJs, /\.slice.*topK/);
});

test("buildRagContext orchestrates RAG pipeline with graceful fallback", () => {
  const embeddingsJs = read("services/api-firebase/src/services/kiosk-embeddings.js");

  // Verify function exists
  assert.match(embeddingsJs, /export async function buildRagContext/);

  // Verify it ensures cache is warm
  assert.match(embeddingsJs, /embeddingCache.size === 0/);

  // Verify it searches embeddings
  assert.match(embeddingsJs, /searchEmbeddings/);

  // Verify fallback to recency-based context
  assert.match(embeddingsJs, /ragUsed: false/);
});

test("kiosk.js imports RAG functions and wires RAG into chat handler", () => {
  const kioskJs = read("services/api-firebase/src/routes/kiosk.js");

  // Verify RAG imports
  assert.match(kioskJs, /import.*buildRagContext.*rebuildEmbeddingIndex.*kiosk-embeddings/);

  // Verify RAG gate in chat handler
  assert.match(kioskJs, /ragEnabled.*kioskConfig.contextConfig\?.ragEnabled/);
  assert.match(kioskJs, /hasEmbeddingKey.*apiKey.*openai/);

  // Verify RAG call with fallback
  assert.match(kioskJs, /buildRagContext.*catch.*buildContext/s);

  // Verify ragUsed in response
  assert.match(kioskJs, /ragUsed.*contextData.ragUsed/);
});

test("kiosk.js has POST /api/kiosk/index endpoint for index rebuild", () => {
  const kioskJs = read("services/api-firebase/src/routes/kiosk.js");

  // Verify endpoint exists
  assert.match(kioskJs, /router.post.*\/api\/kiosk\/index/);

  // Verify admin guard
  assert.match(kioskJs, /requireAuth.*requireRole\("admin"\)/s);

  // Verify it calls rebuildEmbeddingIndex
  assert.match(kioskJs, /rebuildEmbeddingIndex/);

  // Verify response includes documentsIndexed
  assert.match(kioskJs, /documentsIndexed.*result.documentsIndexed/s);
});

test("kiosk-context exports fetchAllIndexableDocuments", () => {
  const contextJs = read("services/api-firebase/src/services/kiosk-context.js");

  // Verify function exists
  assert.match(contextJs, /export async function fetchAllIndexableDocuments/);

  // Verify it fetches all documents
  assert.match(contextJs, /meetings.*get\(\)/s);
  assert.match(contextJs, /business_listings.*get\(\)/s);

  // Verify private scope handling
  assert.match(contextJs, /dataScope === "private"/);
});

test("kiosk-config.js has RAG checkbox and topK input in retentionPanel", () => {
  const configJs = read("apps/secretary-console/views/kiosk/kiosk-config.js");

  // Verify RAG checkbox exists
  assert.match(configJs, /ragEnabledCheckbox/);
  assert.match(configJs, /Enable RAG/);

  // Verify topK input exists
  assert.match(configJs, /ragTopKInput/);
  assert.match(configJs, /Top Results \(K\)/);
});

test("kiosk-config.js serializeForm includes ragEnabled and ragTopK", () => {
  const configJs = read("apps/secretary-console/views/kiosk/kiosk-config.js");

  // Verify ragEnabled is serialized
  assert.match(configJs, /ragEnabled.*formData\.get.*contextConfig\.ragEnabled/);

  // Verify ragTopK is serialized
  assert.match(configJs, /ragTopK.*formData\.get.*contextConfig\.ragTopK/);
});

test("kiosk-config.js has rebuildIndexBtn wired to POST /api/kiosk/index", () => {
  const configJs = read("apps/secretary-console/views/kiosk/kiosk-config.js");

  // Verify rebuild button HTML
  assert.match(configJs, /rebuildIndexBtn/);
  assert.match(configJs, /Rebuild Search Index/);

  // Verify event handler wiring
  assert.match(configJs, /rebuildBtn.*addEventListener.*click/s);

  // Verify API call
  assert.match(configJs, /request.*\/api\/kiosk\/index.*POST/);
});

test("kiosk.js GET /api/kiosk/config returns ragEnabled and ragTopK", () => {
  const kioskJs = read("services/api-firebase/src/routes/kiosk.js");

  // Verify ragEnabled in response
  assert.match(kioskJs, /ragEnabled.*kioskConfig\.contextConfig\?\.ragEnabled/);

  // Verify ragTopK in response
  assert.match(kioskJs, /ragTopK.*kioskConfig\.contextConfig\?\.ragTopK/);
});
