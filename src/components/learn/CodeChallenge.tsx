"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, Play, RefreshCw, TerminalSquare, X } from "lucide-react";
import type { Question } from "@/lib/types";
import { awardQuestion } from "@/lib/progress";
import { cn, levelLabel, levelTone } from "@/lib/utils";
import { CodeEditor } from "./CodeEditor";
import { TerminalPanel, type TerminalHandle } from "./TerminalPanel";
import { usePyodide, type RunOutcome } from "./usePyodide";
import { Markdown } from "./Markdown";
import { WebChallenge } from "./WebChallenge";

export function CodeChallenge({
  question,
  onSolved,
  onNext,
  hasNext,
  onContext,
}: {
  question: Question;
  onSolved: (points: number) => void;
  onNext?: () => void;
  hasNext?: boolean;
  onContext?: (context: { code: string; lastOutput: string }) => void;
}) {
  const config = question.codeConfig;
  const [code, setCode] = useState(config?.starterCode ?? "");
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [running, setRunning] = useState(false);
  const terminalRef = useRef<TerminalHandle | null>(null);
  const { run, status } = usePyodide();

  const solved = useMemo(() => Boolean(outcome?.ok), [outcome]);
  const visibleTests = config?.testCases ?? [];

  const execute = async () => {
    if (!config || running) return;
    setRunning(true);
    setOutcome(null);
    terminalRef.current?.clear();
    terminalRef.current?.write(`$ python ${question.slug.replace(/-/g, "_")}.py`, "cmd");
    terminalRef.current?.write(`# menjalankan ${visibleTests.length} test case`, "dim");

    const result = await run(code, config.functionName, config.testCases);
    setOutcome(result);

    if (result.fatal) {
      terminalRef.current?.write(`✖ ${result.fatal}`, "err");
    } else {
      result.results.forEach((test) => {
        const label = `Test ${test.index + 1}${test.description ? ` (${test.description})` : ""}`;
        if (test.passed) {
          terminalRef.current?.write(`✔ ${label} lolos`, "ok");
        } else {
          terminalRef.current?.write(`✖ ${label} gagal`, "err");
          if (!test.isHidden) {
            terminalRef.current?.write(`    expected: ${test.expected}`, "dim");
            terminalRef.current?.write(`    actual  : ${test.actual}`, "dim");
          }
        }
        if (test.log.trim()) {
          terminalRef.current?.writeBlock(
            test.log.trimEnd().split("\n").map((line) => `    | ${line}`),
            "dim",
          );
        }
        if (test.error) {
          terminalRef.current?.writeBlock(
            test.error.trimEnd().split("\n").map((line) => `    ${line}`),
            "err",
          );
        }
      });
    }

    terminalRef.current?.write("", "dim");
    if (result.ok) {
      terminalRef.current?.write(`★ Semua test lolos dalam ${result.durationMs} ms.`, "ok");
      awardQuestion(question.slug, question.points);
      onSolved(question.points);
    } else {
      terminalRef.current?.write(
        `# ${result.results.filter((item) => item.passed).length}/${result.results.length} test lolos. Perbaiki lalu jalankan lagi.`,
        "warn",
      );
    }

    const summary = result.fatal
      ? result.fatal
      : result.results
          .map((test) =>
            `Test ${test.index + 1}: ${test.passed ? "lolos" : `gagal (expected ${test.expected}, actual ${test.actual})`}`,
          )
          .join("; ");
    onContext?.({ code, lastOutput: summary });
    setRunning(false);
  };

  const reset = () => {
    setCode(config?.starterCode ?? "");
    setOutcome(null);
    terminalRef.current?.clear();
    terminalRef.current?.write("# kode dikembalikan ke awal", "dim");
    onContext?.({ code: config?.starterCode ?? "", lastOutput: "" });
  };

  if (config?.language === "web") {
    return (
      <WebChallenge
        question={question}
        onSolved={onSolved}
        onNext={onNext}
        hasNext={hasNext}
        onContext={onContext}
      />
    );
  }

  if (!config) {
    return (
      <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
        Soal ini belum memiliki konfigurasi kode di CMS.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
        <span className="font-mono uppercase tracking-wider">Tantangan kode</span>
        <span aria-hidden>·</span>
        <span className={cn("rounded border px-1.5 py-px font-medium", levelTone(question.difficulty))}>
          {levelLabel(question.difficulty)}
        </span>
        <span aria-hidden>·</span>
        <span className="font-mono">Python 3</span>
        {status === "loading" && (
          <span className="inline-flex items-center gap-1 text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> menyiapkan Python
          </span>
        )}
      </div>

      <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{question.title}</h2>
      <div className="mt-2 text-[14px] leading-7 text-muted">
        <Markdown content={question.prompt} />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        <CodeEditor
          value={code}
          onChange={(next) => {
            setCode(next);
            onContext?.({ code: next, lastOutput: outcome?.fatal ?? "" });
          }}
          onRun={execute}
          onReset={reset}
          filename={`${question.slug.replace(/-/g, "_")}.py`}
        />

        <div className="overflow-hidden rounded-md border border-border bg-[#111110]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
              <TerminalSquare className="h-3.5 w-3.5" /> output
            </span>
            <span className="font-mono text-[10px] text-neutral-500">
              {outcome ? `${outcome.durationMs} ms` : "idle"}
            </span>
          </div>
          <TerminalPanel ref={terminalRef} className="h-[260px] w-full xl:h-[292px]" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={execute} disabled={running} className="btn-primary">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Menjalankan…" : "Jalankan kode"}
        </button>
        <button type="button" onClick={reset} disabled={running} className="btn-ghost">
          <RefreshCw className="h-4 w-4" /> Reset
        </button>
        {solved && hasNext && (
          <button type="button" onClick={onNext} className="btn-soft">
            Soal berikutnya
          </button>
        )}
      </div>

      {outcome && !outcome.fatal && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {outcome.results.map((result) => (
            <div
              key={result.index}
              className={cn(
                "flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-[12px] leading-5",
                result.passed
                  ? "border-emerald-600/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-300",
              )}
            >
              {result.passed ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium">
                  Test {result.index + 1} · {result.isHidden ? "tersembunyi" : result.description ?? "kasus uji"}
                </p>
                {!result.passed && !result.isHidden && (
                  <p className="mt-0.5 break-words font-mono text-[11px] opacity-80">
                    expected {result.expected} · got {result.actual}
                  </p>
                )}
                {!result.passed && result.isHidden && (
                  <p className="mt-0.5 opacity-80">Hasil belum sesuai untuk kasus uji tambahan.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {outcome?.fatal && (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[12px] leading-6 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="break-words">{outcome.fatal}</p>
        </div>
      )}

      {question.hints.length > 0 && (
        <details className="mt-5 rounded-md border border-border bg-surface px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-muted hover:text-fg">
            Butuh petunjuk? ({question.hints.length})
          </summary>
          <ul className="mt-2.5 space-y-1.5 text-[12px] leading-6 text-muted">
            {question.hints.map((hint, index) => (
              <li key={index} className="flex gap-2">
                <span className="font-mono text-muted">›</span> {hint}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
