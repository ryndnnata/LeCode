"use client";

import { useEffect, useRef, useState } from "react";
import { CornerDownLeft, Loader2, RotateCcw, X } from "lucide-react";
import { MascotAvatar } from "@/components/brand/Mascot";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function renderInline(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

function MessageText({ content }: { content: string }) {
  const blocks = content.split(/```(?:python)?/g);
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (!block) return null;
        if (index % 2 === 1) {
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-md border border-white/10 bg-[#111110] px-3 py-2 font-mono text-[11.5px] leading-5 text-neutral-200"
            >
              <code>{block.trim()}</code>
            </pre>
          );
        }
        return block
          .split("\n")
          .filter((line) => line.trim())
          .map((line, lineIndex) => (
            <p key={`${index}-${lineIndex}`} className="whitespace-pre-wrap">
              {renderInline(line)}
            </p>
          ));
      })}
    </div>
  );
}

const quickPrompts = [
  "Beri petunjuk, jangan jawabannya",
  "Jelaskan konsep di soal ini",
  "Kenapa kodeku error?",
];

const generalPrompts = [
  "Dari mana mulai belajar Python?",
  "Apa bedanya return dan print?",
  "Buatkan contoh loop sederhana",
];

export function AiAssistant({
  question,
  context,
  className,
  onClose,
}: {
  question?: Question;
  context?: { code: string; lastOutput: string };
  className?: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const greeting = "Halo :D";

  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput("");
    abortRef.current?.abort();
  }, [question?.slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          ...(question
            ? {
                question: {
                  title: question.title,
                  prompt: question.prompt,
                  type: question.type,
                  hints: question.hints,
                  explanation: question.explanation,
                },
                code: context?.code ?? "",
                lastOutput: context?.lastOutput ?? "",
              }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Asisten sedang sibuk (${response.status}). Coba lagi sebentar.`);
      }

      setMessages((current) => [...current, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setMessages((current) => {
          const updated = [...current];
          updated[updated.length - 1] = { role: "assistant", content: buffer };
          return updated;
        });
      }
    } catch (sendError) {
      if ((sendError as Error).name === "AbortError") return;
      setError(sendError instanceof Error ? sendError.message : "Gagal menghubungi asisten.");
    } finally {
      setStreaming(false);
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setStreaming(false);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}>
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <MascotAvatar className="h-8 w-8" bubble />
        <div className="min-w-0">
          <p className="text-sm font-medium">Len</p>
          <p className="text-[11px] text-muted">
            {streaming ? "sedang mengetik…" : "asisten belajar"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={reset}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Mulai ulang percakapan"
            title="Mulai ulang percakapan"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="icon-btn h-8 w-8"
              aria-label="Tutup asisten"
              title="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <div className="flex gap-2.5">
          <MascotAvatar className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="rounded-md rounded-tl-none border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] leading-6 text-muted">
            {greeting}
          </div>
        </div>

        {messages.map((message, index) =>
          message.role === "user" ? (
            <div key={index} className="flex justify-end">
              <div className="max-w-[85%] rounded-md rounded-br-none bg-fg px-3 py-2.5 text-[12.5px] leading-6 text-bg">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={index} className="flex gap-2.5">
              <MascotAvatar className="mt-0.5 h-6 w-6 shrink-0" />
              <div className="max-w-[85%] rounded-md rounded-tl-none border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] leading-6 text-muted">
                {message.content ? (
                  <MessageText content={message.content} />
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> menyusun petunjuk…
                  </span>
                )}
              </div>
            </div>
          ),
        )}

        {error && (
          <p className="rounded-md border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-[11.5px] leading-5 text-rose-500">
            {error}
          </p>
        )}

        {messages.length === 0 && (
          <div className="space-y-1.5 pt-1">
            {(question ? quickPrompts : generalPrompts).map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-[11.5px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="border-t border-border p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={question ? "Tanya Len tentang soal ini" : "Tanya Len soal Python atau LeCode"}
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-[12.5px] text-fg outline-none placeholder:text-muted/70 focus:border-fg/40"
            aria-label="Pesan untuk Len AI"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-fg text-bg transition-opacity disabled:opacity-40"
            aria-label="Kirim pesan"
          >
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
