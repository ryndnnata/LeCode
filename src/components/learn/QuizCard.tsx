"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb, RotateCcw, X } from "lucide-react";
import type { Question } from "@/lib/types";
import { awardQuestion } from "@/lib/progress";
import { cn, levelLabel, levelTone } from "@/lib/utils";
import { Markdown } from "./Markdown";

export function QuizCard({
  question,
  onSolved,
  onNext,
  hasNext,
}: {
  question: Question;
  onSolved: (points: number) => void;
  onNext?: () => void;
  hasNext?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [attempts, setAttempts] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const correctId = useMemo(() => question.options?.find((option) => option.isCorrect)?.id, [question]);
  const showHint = attempts >= 1 && status !== "correct";

  const submit = () => {
    if (!selected) return;
    if (selected === correctId) {
      setStatus("correct");
      awardQuestion(question.slug, question.points);
      onSolved(question.points);
    } else {
      setStatus("wrong");
      setAttempts((value) => value + 1);
    }
  };

  const reset = () => {
    setSelected(null);
    setStatus("idle");
    setRevealed(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <span className="font-mono uppercase tracking-wider">Pilihan ganda</span>
        <span aria-hidden>·</span>
        <span className={cn("rounded border px-1.5 py-px font-medium", levelTone(question.difficulty))}>
          {levelLabel(question.difficulty)}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{question.title}</h2>
      <div className="mt-2 text-[14px] leading-7 text-muted">
        <Markdown content={question.prompt} />
      </div>

      <div className="mt-5 space-y-2">
        {question.options?.map((option, index) => {
          const isSelected = selected === option.id;
          const isCorrect = option.id === correctId;
          const showCorrect = status === "correct" || revealed;
          return (
            <button
              key={option.id}
              type="button"
              disabled={status === "correct"}
              onClick={() => {
                setSelected(option.id);
                if (status === "wrong") setStatus("idle");
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left text-sm transition-colors",
                "border-border bg-surface hover:border-fg/30",
                isSelected && status !== "wrong" && "border-fg/50 bg-surface-2",
                status === "wrong" && isSelected && "border-rose-500/50 bg-rose-500/5",
                showCorrect && isCorrect && "border-emerald-600/40 bg-emerald-500/10",
                status === "correct" && !isCorrect && "opacity-50",
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded border border-border bg-surface-2 font-mono text-[11px] text-muted">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1 whitespace-pre-line text-fg">{option.text}</span>
              {showCorrect && isCorrect && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              {status === "wrong" && isSelected && <X className="h-4 w-4 text-rose-500" />}
            </button>
          );
        })}
      </div>

      {showHint && (
        <div className="mt-4 flex gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-[12px] leading-6 text-amber-700 dark:text-amber-300">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Belum tepat. Coba lagi.</p>
            <p className="mt-0.5 opacity-90">
              {question.hints[Math.min(attempts - 1, question.hints.length - 1)]}
            </p>
          </div>
        </div>
      )}

      {status === "correct" && (
        <div className="mt-4 rounded-md border border-emerald-600/30 bg-emerald-500/5 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-4 w-4" /> Benar. Jawabanmu tepat.
          </p>
          {question.explanation && (
            <p className="mt-1.5 text-[13px] leading-6 text-muted">{question.explanation}</p>
          )}
        </div>
      )}

      {status === "wrong" && attempts >= 2 && !revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 text-xs font-medium text-primary hover:underline"
        >
          Tampilkan jawaban yang benar
        </button>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {status !== "correct" ? (
          <button type="button" onClick={submit} disabled={!selected} className="btn-primary">
            Periksa jawaban
          </button>
        ) : hasNext ? (
          <button type="button" onClick={onNext} className="btn-primary">
            Soal berikutnya
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/30 bg-emerald-500/5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Semua soal di materi ini selesai
          </span>
        )}

        {status !== "idle" && (
          <button type="button" onClick={reset} className="btn-ghost">
            <RotateCcw className="h-3.5 w-3.5" /> Ulangi
          </button>
        )}
      </div>
    </div>
  );
}
