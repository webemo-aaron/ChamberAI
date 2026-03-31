import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const DEFAULT_GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const DEFAULT_TEXT_GATEWAY_MODEL = "anthropic/claude-sonnet-4.6";

export function resolveTextGenerationModelName() {
  const configuredModel = String(process.env.AI_TEXT_MODEL ?? "").trim();
  if (configuredModel) {
    return configuredModel;
  }

  if (hasGeminiApiKey()) {
    return DEFAULT_GEMINI_TEXT_MODEL;
  }

  return DEFAULT_TEXT_GATEWAY_MODEL;
}

export function resolveTextGenerationModel() {
  const modelName = resolveTextGenerationModelName();

  if (hasGeminiApiKey()) {
    return createGoogleGenerativeAI({
      apiKey: resolveGeminiApiKey()
    })(modelName);
  }

  return modelName;
}

function hasGeminiApiKey() {
  return Boolean(resolveGeminiApiKey());
}

function resolveGeminiApiKey() {
  const providerKey = sanitizeApiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  if (providerKey) {
    return providerKey;
  }

  const geminiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
  return geminiKey || null;
}

function sanitizeApiKey(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "";
  }

  // Reject accidental env assignment fragments such as "GEMINI_API_KEY=".
  if (/^[A-Z0-9_]+=$/.test(normalized)) {
    return "";
  }

  return normalized;
}
