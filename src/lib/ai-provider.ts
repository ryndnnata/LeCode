import type { ChatTurn } from "./ai";

export type AiProviderId = "gemini" | "groq" | "openai";

export interface AiProvider {
  id: AiProviderId;
  label: string;
  model: string;
  url: string;
  headers: Record<string, string>;
  buildBody: (system: string, history: ChatTurn[]) => unknown;
  extractDelta: (payload: unknown) => string;
}

const clean = (value: string | undefined) => (value ?? "").trim();

function openAiCompatible(
  id: "groq" | "openai",
  label: string,
  url: string,
  key: string,
  model: string,
): AiProvider {
  return {
    id,
    label,
    model,
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    buildBody: (system, history) => ({
      model,
      stream: true,
      temperature: 0.6,
      max_tokens: 700,
      messages: [{ role: "system", content: system }, ...history],
    }),
    extractDelta: (payload) => {
      const parsed = payload as {
        choices?: Array<{ delta?: { content?: string | null } }>;
      };
      return parsed.choices?.[0]?.delta?.content ?? "";
    },
  };
}

function geminiProvider(key: string): AiProvider {
  const model = (clean(process.env.GEMINI_MODEL) || "gemini-2.5-flash").replace(/^models\//, "");
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}` +
    `:streamGenerateContent?alt=sse&key=${encodeURIComponent(key)}`;

  return {
    id: "gemini",
    label: "Gemini",
    model,
    url,
    headers: { "Content-Type": "application/json" },
    buildBody: (system, history) => ({
      systemInstruction: { parts: [{ text: system }] },
      contents: history.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 800,
      },
    }),
    extractDelta: (payload) => {
      const parsed = payload as {
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        }>;
      };
      const parts = parsed.candidates?.[0]?.content?.parts ?? [];
      return parts
        .filter((part) => !part.thought)
        .map((part) => part.text ?? "")
        .join("");
    },
  };
}

function groqProvider(key: string): AiProvider {
  return openAiCompatible(
    "groq",
    "Groq",
    clean(process.env.GROQ_API_URL) || "https://api.groq.com/openai/v1/chat/completions",
    key,
    clean(process.env.GROQ_MODEL) || "llama-3.3-70b-versatile",
  );
}

function openAiProvider(key: string): AiProvider {
  return openAiCompatible(
    "openai",
    "OpenAI-compatible",
    clean(process.env.AI_API_URL) || "https://api.openai.com/v1/chat/completions",
    key,
    clean(process.env.AI_MODEL) || "gpt-4o-mini",
  );
}

export function resolveAiProvider(): AiProvider | null {
  const requested = clean(process.env.AI_PROVIDER).toLowerCase();
  const geminiKey = clean(process.env.GEMINI_API_KEY);
  const groqKey = clean(process.env.GROQ_API_KEY);
  const openAiKey = clean(process.env.AI_API_KEY);

  if (requested === "gemini" || requested === "google") {
    return geminiKey ? geminiProvider(geminiKey) : null;
  }
  if (requested === "groq") {
    return groqKey ? groqProvider(groqKey) : null;
  }
  if (requested === "openai" || requested === "compatible" || requested === "custom") {
    return openAiKey ? openAiProvider(openAiKey) : null;
  }

  if (geminiKey) return geminiProvider(geminiKey);
  if (groqKey) return groqProvider(groqKey);
  if (openAiKey) return openAiProvider(openAiKey);

  return null;
}

export function describeAiProvider() {
  const provider = resolveAiProvider();
  return provider ? { id: provider.id, label: provider.label, model: provider.model } : null;
}
