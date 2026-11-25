"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Braces, Check, Clock3, FileQuestion, Search } from "lucide-react";
import type { Lesson, Question } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import { cn, levelLabel, levelTone } from "@/lib/utils";

type Filter = "semua" | "mcq" | "code";

const filters: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "mcq", label: "Pilihan ganda" },
  { id: "code", label: "Tantangan kode" },
];

export function LearnBrowser({ lessons, questions }: { lessons: Lesson[]; questions: Question[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");
  const [showAllTests, setShowAllTests] = useState(false);
  const progress = useProgress();

  const normalized = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; code: number; mcq: number }>();
    for (const question of questions) {
      const current = map.get(question.lessonSlug) ?? { total: 0, code: 0, mcq: 0 };
      current.total += 1;
      if (question.type === "code") current.code += 1;
      else current.mcq += 1;
      map.set(question.lessonSlug, current);
    }
    return map;
  }, [questions]);

  const filteredLessons = useMemo(
    () =>
      lessons.filter((lesson) => {
        if (!normalized) return true;
        return (
          lesson.title.toLowerCase().includes(normalized) ||
          lesson.summary.toLowerCase().includes(normalized) ||
          lesson.topic.toLowerCase().includes(normalized) ||
          lesson.tags.some((tag) => tag.includes(normalized))
        );
      }),
    [lessons, normalized],
  );

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) => {
        if (filter !== "semua" && question.type !== filter) return false;
        if (!normalized) return true;
        return (
          question.title.toLowerCase().includes(normalized) ||
          question.prompt.toLowerCase().includes(normalized)
        );
      }),
    [questions, filter, normalized],
  );

  const showQuestions = showAllTests || filter !== "semua" || normalized.length > 0;

  return (
    <div>
      {/* Toolbar */}
      <div className="sticky top-14 z-20 -mx-5 border-b border-border bg-bg px-5 py-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:rounded-lg lg:border lg:px-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari materi atau topik"
              className="input pl-9"
              aria-label="Cari materi"
            />
          </div>
          <div
            className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 sm:mx-0 sm:px-0"
            role="group"
            aria-label="Filter tipe tes"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={filter === item.id}
                className={cn(
                  "whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-medium transition-colors",
                  filter === item.id
                    ? "bg-surface-2 text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
        <p>
          {filteredLessons.length} materi · {filteredQuestions.length} tes
        </p>
        <p className="font-mono">{progress.solved.length} tes selesai</p>
      </div>

      {showQuestions && (
        <section className="mt-6">
          <h2 className="text-sm font-medium">
            {filter === "code" ? "Tantangan kode" : filter === "mcq" ? "Kuis pilihan ganda" : "Hasil tes"}
          </h2>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
            {filteredQuestions.slice(0, 12).map((question) => {
              const solved = progress.solved.includes(question.slug);
              return (
                <Link
                  key={question.slug}
                  href={`/belajar/${question.lessonSlug}?soal=${question.slug}`}
                  className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-surface-2 sm:px-4"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-muted">
                    {question.type === "code" ? <Braces className="h-3.5 w-3.5" /> : <FileQuestion className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-medium text-fg">{question.title}</span>
                      {solved && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                      <span className={cn("rounded border px-1 py-px text-[10px]", levelTone(question.difficulty))}>
                        {levelLabel(question.difficulty)}
                      </span>
                      {question.type === "code" ? "Tulis kode" : "Pilihan ganda"}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
            {filteredQuestions.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted">Tidak ada tes yang cocok.</p>
            )}
          </div>
          {!showAllTests && filteredQuestions.length > 12 && (
            <button
              type="button"
              onClick={() => setShowAllTests(true)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              Lihat semua {filteredQuestions.length} tes
            </button>
          )}
        </section>
      )}

      {/* Materi */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Jalur materi</h2>
          <span className="font-mono text-[11px] text-muted">urut dari dasar</span>
        </div>

        <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {filteredLessons.map((lesson) => {
            const stat = counts.get(lesson.slug) ?? { total: 0, code: 0, mcq: 0 };
            return (
              <Link
                key={lesson.slug}
                href={`/belajar/${lesson.slug}`}
                className="group flex items-start gap-4 p-4 transition-colors hover:bg-surface-2 sm:items-center sm:p-5"
              >
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2 font-mono text-[11px] text-muted">
                  {String(lesson.order).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium group-hover:text-primary">{lesson.title}</span>
                    <span className={cn("rounded border px-1.5 py-px text-[10px] font-medium", levelTone(lesson.level))}>
                      {levelLabel(lesson.level)}
                    </span>
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[13px] leading-6 text-muted">{lesson.summary}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3 w-3" /> {lesson.estimatedMinutes} menit
                    </span>
                    <span>{stat.mcq} kuis</span>
                    <span>{stat.code} kode</span>
                    <span className="hidden sm:inline">{lesson.topic}</span>
                  </span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:mt-0" />
              </Link>
            );
          })}
        </div>

        {filteredLessons.length === 0 && (
          <p className="mt-4 rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted">
            Materi tidak ditemukan. Coba kata kunci lain.
          </p>
        )}
      </section>
    </div>
  );
}
