import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION, GEMINI_MODEL } from "../../constants/ai.js";
import { isFallbackError, sleep } from "../../utils/errors.js";

export function createGeminiProvider(apiKey) {
  if (!apiKey) return null;

  const genAI = new GoogleGenAI({ apiKey });

  return {
    name: "Gemini",
    async ask(prompt) {
      const maxRetries = 3;

      for (let attempt = 0; attempt < maxRetries; attempt += 1) {
        try {
          const response = await genAI.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              systemInstruction: AI_SYSTEM_INSTRUCTION,
              httpOptions: { timeout: 30000 },
            },
          });

          const text = response.text?.trim();
          if (text) return text;
          throw new Error("Empty response from Gemini API.");
        } catch (error) {
          console.error(
            `Gemini failed (attempt ${attempt + 1}/${maxRetries}).`,
            error,
          );

          if (!isFallbackError(error) || attempt === maxRetries - 1) {
            throw error;
          }

          await sleep(1500 * 2 ** attempt);
        }
      }

      throw new Error("Gemini failed after all retries.");
    },
  };
}
