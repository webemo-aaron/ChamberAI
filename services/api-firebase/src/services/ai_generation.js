import { generateText } from "ai";

const DEFAULT_GATEWAY_MODEL = "anthropic/claude-sonnet-4.6";

export async function maybeEnhancePublicSummary(seed, context = {}) {
  if (!isAiGenerationEnabled()) {
    return { output: seed, meta: disabledMeta() };
  }

  const model = process.env.AI_TEXT_MODEL || DEFAULT_GATEWAY_MODEL;
  const startedAt = Date.now();
  try {
    const prompt = [
      "You are creating a chamber-of-commerce public meeting summary.",
      "Return JSON only with keys:",
      'title, highlights, impact, motions, actions, attendance, call_to_action, notes, content',
      "Use concise, non-confidential language suitable for public publication.",
      "Keep details factual and avoid speculation.",
      "",
      "Meeting context:",
      JSON.stringify(context),
      "",
      "Current draft seed:",
      JSON.stringify(seed)
    ].join("\n");

    const { text } = await generateText({
      model,
      prompt
    });
    const parsed = parseJsonObject(text);
    if (!parsed) {
      throw new Error("Model response was not valid JSON.");
    }

    const output = {
      fields: {
        title: asText(parsed.title, seed.fields?.title),
        highlights: asText(parsed.highlights, seed.fields?.highlights),
        impact: asText(parsed.impact, seed.fields?.impact),
        motions: asText(parsed.motions, seed.fields?.motions),
        actions: asText(parsed.actions, seed.fields?.actions),
        attendance: asText(parsed.attendance, seed.fields?.attendance),
        call_to_action: asText(parsed.call_to_action, seed.fields?.call_to_action),
        notes: asText(parsed.notes, seed.fields?.notes)
      },
      content: asText(parsed.content, seed.content)
    };

    return {
      output,
      meta: {
        ai_used: true,
        provider: "gateway",
        model,
        latency_ms: Date.now() - startedAt,
        error: null
      }
    };
  } catch (error) {
    return {
      output: seed,
      meta: {
        ai_used: false,
        provider: "gateway",
        model,
        latency_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown_error"
      }
    };
  }
}

export async function maybeEnhanceGeoBrief(seed, context = {}) {
  if (!isAiGenerationEnabled()) {
    return { output: seed, meta: disabledMeta() };
  }

  const model = process.env.AI_TEXT_MODEL || DEFAULT_GATEWAY_MODEL;
  const startedAt = Date.now();
  try {
    const prompt = [
      "You are drafting a local-market AI opportunity brief for chamber-led business enablement.",
      "Return JSON only with keys: top_use_cases, opportunity_summary, outreach_draft.",
      "top_use_cases must be an array of exactly 3 short strings.",
      "Keep the copy practical, local, and outcomes-oriented.",
      "",
      "Geo profile context:",
      JSON.stringify(context),
      "",
      "Current brief seed:",
      JSON.stringify(seed)
    ].join("\n");

    const { text } = await generateText({
      model,
      prompt
    });
    const parsed = parseJsonObject(text);
    if (!parsed) {
      throw new Error("Model response was not valid JSON.");
    }

    const topUseCases = normalizeUseCases(parsed.top_use_cases, seed.top_use_cases);
    const output = {
      ...seed,
      top_use_cases: topUseCases,
      opportunity_summary: asText(parsed.opportunity_summary, seed.opportunity_summary),
      outreach_draft: asText(parsed.outreach_draft, seed.outreach_draft)
    };

    return {
      output,
      meta: {
        ai_used: true,
        provider: "gateway",
        model,
        latency_ms: Date.now() - startedAt,
        error: null
      }
    };
  } catch (error) {
    return {
      output: seed,
      meta: {
        ai_used: false,
        provider: "gateway",
        model,
        latency_ms: Date.now() - startedAt,
        error: error instanceof Error ? error.message : "unknown_error"
      }
    };
  }
}

function isAiGenerationEnabled() {
  return process.env.AI_GENERATION_ENABLED === "true";
}

function disabledMeta() {
  return {
    ai_used: false,
    provider: "gateway",
    model: process.env.AI_TEXT_MODEL || DEFAULT_GATEWAY_MODEL,
    latency_ms: 0,
    error: "ai_generation_disabled"
  };
}

function asText(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  return String(fallback ?? "").trim();
}

function normalizeUseCases(value, fallback = []) {
  if (Array.isArray(value)) {
    const clean = value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 3);
    if (clean.length === 3) return clean;
  }
  const baseline = Array.isArray(fallback) ? fallback : [];
  return baseline.slice(0, 3);
}

function parseJsonObject(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}
