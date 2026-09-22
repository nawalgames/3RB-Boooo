import { env } from "../../config/env.js";
import { fallbackReplies } from "../../constants/ai.js";
import { createGeminiProvider } from "./gemini.js";
import { createOpenAiCompatibleProvider } from "./openAiCompatible.js";

const providers = [
  createGeminiProvider(env.ai.geminiApiKey),
  createOpenAiCompatibleProvider({
    name: "OpenRouter",
    apiKey: env.ai.openRouterApiKey,
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: env.ai.openRouterModel,
    extraHeaders: {
      "HTTP-Referer": "https://discord.com/",
      "X-Title": "3RB Discord Bot",
    },
  }),
  createOpenAiCompatibleProvider({
    name: "Groq",
    apiKey: env.ai.groqApiKey,
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: env.ai.groqModel,
  }),
].filter(Boolean);

export async function askAI(prompt) {
  let lastError = null;

  for (const provider of providers) {
    try {
      console.info(`Trying AI provider: ${provider.name}`);
      const result = await provider.ask(prompt);
      console.info(`AI response received from ${provider.name}.`);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`${provider.name} failed.`, error);
    }
  }

  throw lastError || new Error("All AI providers failed.");
}

export function getFallbackReply() {
  return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
}
