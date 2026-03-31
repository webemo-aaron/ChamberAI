import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GEMINI_TEXT_MODEL,
  resolveTextGenerationModelName
} from "../../services/api-firebase/src/services/ai-models.js";

test("ai model resolver prefers a valid Gemini key over malformed assignment fragments", () => {
  const originalGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.AI_TEXT_MODEL;

  process.env.GOOGLE_GENERATIVE_AI_API_KEY = "GOOGLE_GENERATIVE_AI_API_KEY=";
  process.env.GEMINI_API_KEY = "AIza-real-gemini-key";
  delete process.env.AI_TEXT_MODEL;

  assert.equal(resolveTextGenerationModelName(), DEFAULT_GEMINI_TEXT_MODEL);

  if (originalGoogleKey === undefined) {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  } else {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleKey;
  }
  if (originalGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
  if (originalModel === undefined) {
    delete process.env.AI_TEXT_MODEL;
  } else {
    process.env.AI_TEXT_MODEL = originalModel;
  }
});
