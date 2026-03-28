import { generateText } from "ai";

/**
 * Abstract base class for AI providers
 */
class AIProvider {
  constructor(config) {
    this.config = config;
    this.name = this.constructor.name;
  }

  /**
   * Generate a response from the AI provider
   * @param {string} message - User message
   * @param {string} context - Context (meetings, motions, etc)
   * @param {object} systemPrompt - System instructions
   * @returns {Promise<{response: string, tokensUsed: number, metadata: object}>}
   */
  async generateResponse(message, context, systemPrompt) {
    throw new Error("generateResponse must be implemented by subclass");
  }

  /**
   * Validate provider configuration
   * @throws {Error} - If configuration is invalid
   */
  validateConfig() {
    if (!this.config || typeof this.config !== "object") {
      throw new Error("Invalid provider configuration");
    }
  }
}

/**
 * Claude provider using Anthropic's API via the ai package
 */
export class ClaudeProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.model) {
      throw new Error("Claude provider requires model selection");
    }
    // API key can come from config or environment at runtime
  }

  async generateResponse(message, context, systemPrompt) {
    try {
      const fullSystemPrompt = `${systemPrompt}\n\nContext:\n${context}`;

      const { text, usage } = await generateText({
        model: `anthropic/${this.config.model || "claude-3-5-sonnet-20241022"}`,
        system: fullSystemPrompt,
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 1024
      });

      return {
        response: text,
        tokensUsed: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
        metadata: {
          provider: "claude",
          model: this.config.model,
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0
        }
      };
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }
}

/**
 * OpenAI provider using OpenAI's API
 */
export class OpenAIProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.model) {
      throw new Error("OpenAI provider requires model selection");
    }
    // API key can come from config or environment at runtime
  }

  async generateResponse(message, context, systemPrompt) {
    try {
      const fullSystemPrompt = `${systemPrompt}\n\nContext:\n${context}`;

      const { text, usage } = await generateText({
        model: `openai/${this.config.model || "gpt-4o-mini"}`,
        system: fullSystemPrompt,
        messages: [
          {
            role: "user",
            content: message
          }
        ],
        temperature: this.config.temperature ?? 0.7,
        maxTokens: this.config.maxTokens ?? 1024
      });

      return {
        response: text,
        tokensUsed: (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
        metadata: {
          provider: "openai",
          model: this.config.model,
          promptTokens: usage?.promptTokens ?? 0,
          completionTokens: usage?.completionTokens ?? 0
        }
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

/**
 * Custom HTTP endpoint provider
 */
export class CustomProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.validateConfig();
  }

  validateConfig() {
    super.validateConfig();
    if (!this.config.endpoint) {
      throw new Error("Custom provider requires endpoint URL");
    }
    if (!this.config.endpoint.startsWith("http")) {
      throw new Error("Custom provider endpoint must be a valid HTTP URL");
    }
  }

  async generateResponse(message, context, systemPrompt) {
    try {
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.authHeader && { Authorization: this.config.authHeader })
        },
        body: JSON.stringify({
          message,
          context,
          systemPrompt,
          temperature: this.config.temperature ?? 0.7,
          maxTokens: this.config.maxTokens ?? 1024
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        response: data.response || data.text || "",
        tokensUsed: data.tokensUsed ?? 0,
        metadata: {
          provider: "custom",
          endpoint: this.config.endpoint,
          ...data.metadata
        }
      };
    } catch (error) {
      throw new Error(`Custom provider error: ${error.message}`);
    }
  }
}

/**
 * Factory function to create the appropriate AI provider
 * @param {object} config - Provider configuration
 * @returns {AIProvider} - Instantiated provider
 * @throws {Error} - If provider type is unknown or config is invalid
 */
export function createProvider(config) {
  if (!config || !config.type) {
    throw new Error("Provider config must include type");
  }

  switch (config.type.toLowerCase()) {
    case "claude":
      return new ClaudeProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "custom":
      return new CustomProvider(config);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}
