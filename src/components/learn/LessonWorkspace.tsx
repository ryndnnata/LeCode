"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronRight } from "lucide-react";
import type { Lesson, Question } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import { cn, levelLabel, levelTone } from "@/lib/utils";
import { Markdown } from "./Markdown";
import { QuizCard } from "./QuizCard";
import { CodeChallenge } from "./CodeChallenge";
import { AiAssistant } from "./AiAssistant";
import { useRegisterLen } from "./len-context";

type Tab = "materi" | "latihan";

export function LessonWorkspace({
  lesson,
  questions,
  initialSlug,
}: {
  lesson: Lesson;
  questions: Question[];
  initialSlug?: string;
}) {
  const initialIndex = Math.max(0, questions.findIndex((question) => question.slug === initialSlug));
  const [tab, setTab] = useState<Tab>(initialSlug ? "latihan" : "materi");
  const [index, setIndex] = useState(initialIndex);
  const [context, setContext] = useState<{ code: string; lastOutput: string }>({
    code: "",
    lastOutput: "",
  });
  const progress = useProgress();

  const active = questions[index];
  useRegisterLen(active, context);
  const solvedCount = useMemo(
    () => questions.filter((question) => progress.solved.includes(question.slug)).length,
    [questions, progress.solved],
  );
  const percent = Math.round((solvedCount / Math.max(1, questions.length)) * 100);

  const goNext = () => {
    if (index < questions.length - 1) {
      setIndex(index + 1);
      setContext({ code: "", lastOutput: "" });
    }
  };

  return (
    <div className="container-page py-8 pb-24 md:pb-8">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/belajar" className="inline-flex items-center gap-1 transition-colors hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> Belajar
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-fg">{lesson.title}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span className="font-mono uppercase tracking-wider">{lesson.topic}</span>
            <span aria-hidden>·</span>
            <span className={cn("rounded border px-1.5 py-px font-medium", levelTone(lesson.level))}>
              {levelLabel(lesson.level)}
            </span>
            <span aria-hidden>·</span>
            <span>{lesson.estimatedMinutes} menit</span>
          </div>
          <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{lesson.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{lesson.summary}</p>
        </div>

        <div className="hidden w-40 items-center gap-2 xl:flex">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
          </div>
          <span className="font-mono text-[11px] text-muted">
            {solvedCount}/{questions.length}
          </span>
        </div>
      </div>

      {/* Tab */}
      <div className="mt-6 flex items-end justify-between border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { id: "materi" as Tab, label: "Materi" },
            { id: "latihan" as Tab, label: `Latihan (${questions.length})` },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              className={cn(
                "-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors",
                tab === item.id
                  ? "border-fg font-medium text-fg"
                  : "border-transparent text-muted hover:text-fg",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {tab === "materi" ? (
            <article className="card p-5 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Materi</p>
              <div className="mt-3">
                <Markdown content={lesson.content} />
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-2 p-4">
                <div>
                  <p className="text-sm font-medium">Sudah paham? Uji dengan {questions.length} tes.</p>
                  <p className="mt-0.5 text-xs text-muted">Kuis pilihan ganda dan tantangan kode dengan test case.</p>
                </div>
                <button type="button" onClick={() => setTab("latihan")} className="btn-primary">
                  Mulai latihan <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ) : questions.length === 0 ? (
            <div className="card p-8 text-center text-sm text-muted">
              Belum ada soal untuk materi ini. Tambahkan lewat Admin &amp; CMS.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Navigator soal */}
              <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-border bg-surface p-2">
                {questions.map((question, questionIndex) => {
                  const isSolved = progress.solved.includes(question.slug);
                  return (
                    <button
                      key={question.slug}
                      type="button"
                      onClick={() => {
                        setIndex(questionIndex);
                        setContext({ code: "", lastOutput: "" });
                      }}
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md border text-xs font-medium transition-colors",
                        questionIndex === index
                          ? "border-fg bg-fg text-bg"
                          : isSolved
                            ? "border-border bg-surface-2 text-emerald-600 dark:text-emerald-400"
                            : "border-border bg-surface text-muted hover:border-fg/30 hover:text-fg",
                      )}
                      title={question.title}
                      aria-label={`Soal ${questionIndex + 1}: ${question.title}`}
                    >
                      {isSolved ? <Check className="h-3.5 w-3.5" /> : questionIndex + 1}
                    </button>
                  );
                })}
                <div className="ml-auto flex shrink-0 items-center gap-1 pl-1">
                  <span className="hidden pr-1 font-mono text-[11px] text-muted sm:inline">
                    {index + 1}/{questions.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIndex(Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="icon-btn h-8 w-8 disabled:opacity-40"
                    aria-label="Soal sebelumnya"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={index >= questions.length - 1}
                    className="icon-btn h-8 w-8 disabled:opacity-40"
                    aria-label="Soal berikutnya"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="card p-4 sm:p-6">
                {active && active.type === "code" ? (
                  <CodeChallenge
                    key={active.slug}
                    question={active}
                    onSolved={() => undefined}
                    onNext={goNext}
                    hasNext={index < questions.length - 1}
                    onContext={setContext}
                  />
                ) : active ? (
                  <QuizCard
                    key={active.slug}
                    question={active}
                    onSolved={() => undefined}
                    onNext={goNext}
                    hasNext={index < questions.length - 1}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant — panel tetap di desktop */}
        <aside className="hidden xl:block">
          <div className="sticky top-[72px] overflow-hidden rounded-lg border border-border bg-surface">
            <div className="h-[calc(100dvh-140px)]">
              {active ? (
                <AiAssistant question={active} context={context} />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted">
                  Pilih soal untuk mulai bertanya.
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-xs text-muted">Selesai dengan materi ini? Lanjut ke tantangan berikutnya.</p>
        <div className="flex gap-2">
          <Link href="/belajar" className="btn-ghost text-xs">
            Semua materi
          </Link>
          <Link href="/game/boss-sintaks" className="btn-primary text-xs">
            Uji di boss battle <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
