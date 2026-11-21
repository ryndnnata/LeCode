import {
  buildFallbackReply,
  buildGeneralFallbackReply,
  buildGeneralSystemPrompt,
  buildSystemPrompt,
  type ChatTurn,
} from "@/lib/ai";
import { resolveAiProvider } from "@/lib/ai-provider";
import type { Question } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  messages?: ChatTurn[];
  question?: Pick<Question, "title" | "prompt" | "type" | "hints" | "explanation">;
  code?: string;
  lastOutput?: string;
}


const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;

function rateLimited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

function textStream(text: string, source: string) {
  const chunks = text.match(/[\s\S]{1,24}/g) ?? [text];
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          await new Promise((resolve) => setTimeout(resolve, 14));
        }
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-LeCode-AI": source,
      },
    },
  );
}

function plainText(body: string, source: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-LeCode-AI": source,
    },
  });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  if (rateLimited(ip)) {
    return new Response("Terlalu banyak permintaan. Tunggu satu menit lalu coba lagi.", { status: 429 });
  }

  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return new Response("Permintaan tidak valid.", { status: 400 });
  }

  const rawQuestion = body.question;
  const question =
    rawQuestion && String(rawQuestion.title ?? "").trim()
      ? {
          title: String(rawQuestion.title).slice(0, 200),
          prompt: String(rawQuestion.prompt ?? ""),
          type: rawQuestion.type === "code" ? ("code" as const) : ("mcq" as const),
          hints: Array.isArray(rawQuestion.hints)
            ? rawQuestion.hints.map((hint) => String(hint)).slice(0, 6)
            : [],
          explanation: String(rawQuestion.explanation ?? ""),
        }
      : undefined;

  const history = (body.messages ?? [])
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .slice(-8)
    .map((message) => ({ role: message.role, content: String(message.content).slice(0, 2000) }));

  if (history.length === 0) {
    return new Response("Pesan tidak boleh kosong.", { status: 400 });
  }

  const code = String(body.code ?? "").slice(0, 4000);
  const lastOutput = String(body.lastOutput ?? "").slice(0, 1200);
  const lastMessage = history.at(-1)?.content ?? "";
  const attempt = history.filter((message) => message.role === "user").length - 1;

  const provider = resolveAiProvider();
  const source = provider ? `${provider.id}:${provider.model}` : "local";

  const localReply = () =>
    question
      ? buildFallbackReply({
          question,
          code,
          message: lastMessage,
          attempt,
        })
      : buildGeneralFallbackReply({ message: lastMessage });

  if (!provider) {
    return textStream(localReply(), source);
  }

  const system = question
    ? buildSystemPrompt(question, code, lastOutput)
    : buildGeneralSystemPrompt();

  try {
    const upstream = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify(provider.buildBody(system, history)),
    });

    if (!upstream.ok || !upstream.body) {
      console.error(
        `[LeCode] AI ${provider.label} gagal (${upstream.status}):`,
        (await upstream.text().catch(() => "")).slice(0, 300),
      );
      return plainText(localReply(), `${source}:fallback`);
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        let buffer = "";
        let sent = 0;
        const send = (text: string) => {
          try {
            controller.enqueue(encoder.encode(text));
            return true;
          } catch {
            
            return false;
          }
        };
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === "[DONE]") continue;
              try {
                const delta = provider.extractDelta(JSON.parse(payload));
                if (delta) {
                  sent += delta.length;
                  send(delta);
                }
              } catch {
                
              }
            }
          }
        } catch (error) {
          console.error(`[LeCode] Stream ${provider.label} terputus:`, error);
          send("\n\n(Maaf, koneksi ke model terputus. Coba kirim ulang pesanmu.)");
        } finally {
          if (sent === 0) send(localReply());
          try {
            controller.close();
          } catch {
          
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
        "X-LeCode-AI": source,
      },
    });
  } catch (error) {
    console.error(`[LeCode] AI ${provider.label} error:`, error);
    return plainText(localReply(), `${source}:fallback`);
  }
}
