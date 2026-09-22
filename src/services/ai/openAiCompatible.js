import { fetchWithTimeout } from "../../utils/http.js";
import { AI_SYSTEM_INSTRUCTION } from "../../constants/ai.js";

export function createOpenAiCompatibleProvider({
  name,
  apiKey,
  url,
  model,
  extraHeaders = {},
}) {
  if (!apiKey) return null;

  return {
    name,
    async ask(prompt) {
      const response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: AI_SYSTEM_INSTRUCTION },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
        },
        30000,
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(
          data?.error?.message || `${name} API Error ${response.status}`,
        );
        error.status = response.status;
        throw error;
      }

      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error(`Empty response from ${name}.`);
      return text;
    },
  };
}
