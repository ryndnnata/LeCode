"use client";

import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function CodeEditor({
  value,
  onChange,
  onRun,
  onReset,
  filename = "main.py",
  className,
  ariaLabel = "Editor kode Python",
  placeholder = "# tulis kodemu di sini...",
}: {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  filename?: string;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const lines = value.split("\n");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = `${value.slice(0, start)}    ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRun?.();
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-md border border-border bg-[#111110]", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="truncate font-mono text-[11px] text-neutral-400">{filename}</span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden font-mono text-[10px] text-neutral-500 sm:inline">Ctrl+Enter</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[10px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
              title="Kembalikan ke kode awal"
            >
              <RotateCcw className="h-3 w-3" /> reset
            </button>
          )}
        </div>
      </div>

      <div className="flex max-h-[380px] min-h-[220px] overflow-hidden">
        <div
          ref={gutterRef}
          aria-hidden
          className="select-none overflow-hidden border-r border-white/[0.06] bg-black/20 px-2.5 py-3 text-right font-mono text-[13px] leading-6 text-neutral-600"
        >
          {lines.map((_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(event) => {
            if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className="min-h-[220px] w-full flex-1 resize-none overflow-auto bg-transparent px-3 py-3 font-mono text-[13px] leading-6 text-neutral-100 caret-[#6e8cff] outline-none placeholder:text-neutral-600"
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
      </div>
    </div>
  );
}
