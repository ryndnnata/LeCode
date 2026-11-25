"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Code2,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  TerminalSquare,
  X,
} from "lucide-react";
import type { Question, WebFiles } from "@/lib/types";
import { awardQuestion } from "@/lib/progress";
import { cn, levelLabel, levelTone } from "@/lib/utils";
import { CodeEditor } from "./CodeEditor";
import { Markdown } from "./Markdown";

type Tab = "html" | "css" | "js";

interface ConsoleLine {
  level: "log" | "info" | "warn" | "error" | "system";
  text: string;
}

interface CheckResult {
  index: number;
  description?: string;
  isHidden?: boolean;
  passed: boolean;
  expected: string;
  actual: string;
}

interface CheckResponse {
  passed: boolean;
  value?: unknown;
  error?: string;
}

const TABS: { id: Tab; label: string; filename: string }[] = [
  { id: "html", label: "HTML", filename: "index.html" },
  { id: "css", label: "CSS", filename: "styles.css" },
  { id: "js", label: "JavaScript", filename: "script.js" },
];

const EMPTY_FILES: WebFiles = { html: "", css: "", js: "" };

/**
 * Jembatan kecil di dalam iframe pratinjau:
 * - meneruskan console.log/warn/error ke panel console,
 * - menerima ekspresi pemeriksaan dari halaman induk dan mengembalikan hasilnya.
 */
const BRIDGE = `<script>
(function () {
  var send = function (payload) {
    payload.source = "lecode-preview";
    try { parent.postMessage(payload, "*"); } catch (error) {}
  };
  var format = function (args) {
    return Array.prototype.map.call(args, function (value) {
      if (typeof value === "string") return value;
      try { return JSON.stringify(value); } catch (error) { return String(value); }
    }).join(" ");
  };
  ["log", "info", "warn", "error"].forEach(function (level) {
    var original = console[level] ? console[level].bind(console) : function () {};
    console[level] = function () {
      send({ type: "console", level: level, text: format(arguments) });
      original.apply(null, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send({ type: "console", level: "error", text: event.message });
  });
  window.addEventListener("unhandledrejection", function (event) {
    send({ type: "console", level: "error", text: "Promise ditolak: " + String(event.reason) });
  });
  window.addEventListener("message", function (event) {
    var data = event.data || {};
    if (data.source !== "lecode-parent" || data.type !== "check") return;
    var result;
    try {
      var value = new Function("return (" + data.expression + ");")();
      result = { passed: true, value: value };
    } catch (error) {
      result = { passed: false, error: String(error && error.message ? error.message : error) };
    }
    send({ type: "check-result", id: data.id, result: result });
  });
  send({ type: "ready" });
})();
</script>`;

const escapeClosingScript = (value: string) => value.replace(/<\/script/gi, "<\\/script");

function buildDoc(files: WebFiles) {
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${files.css}</style>
${BRIDGE}
</head>
<body>
${files.html}
<script>${escapeClosingScript(files.js)}</script>
</body>
</html>`;
}

function parseJson(value: string): { ok: boolean; value: unknown } {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: value };
  }
}

function sameValue(actual: unknown, expected: unknown) {
  if (actual === expected) return true;
  try {
    return JSON.stringify(actual) === JSON.stringify(expected);
  } catch {
    return false;
  }
}

function starterFiles(question: Question): WebFiles {
  const config = question.codeConfig;
  if (config?.web) return { ...config.web };
  return { ...EMPTY_FILES, html: config?.starterCode ?? "" };
}

export function WebChallenge({
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
  const initialFiles = useMemo(() => starterFiles(question), [question]);
  const [files, setFiles] = useState<WebFiles>(initialFiles);
  const [tab, setTab] = useState<Tab>("html");
  const [doc, setDoc] = useState(() => buildDoc(initialFiles));
  const [runId, setRunId] = useState(0);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const awaitingRun = useRef(false);
  const pendingChecks = useRef(new Map<string, (result: CheckResponse) => void>());

  const checks = config?.testCases ?? [];
  const solved = useMemo(() => Boolean(results && results.length > 0 && results.every((item) => item.passed)), [results]);

  const appendLine = useCallback((line: ConsoleLine) => {
    setLines((current) => [...current.slice(-119), line]);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as
        | { source?: string; type?: string; level?: ConsoleLine["level"]; text?: string; id?: string; result?: CheckResponse }
        | null;
      if (!data || data.source !== "lecode-preview") return;

      if (data.type === "console") {
        appendLine({ level: data.level ?? "log", text: data.text ?? "" });
        return;
      }

      if (data.type === "check-result" && data.id) {
        const resolver = pendingChecks.current.get(data.id);
        if (resolver) {
          pendingChecks.current.delete(data.id);
          resolver(data.result ?? { passed: false, error: "Tidak ada hasil." });
        }
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [appendLine]);

  const ask = useCallback((expression: string) => {
    return new Promise<CheckResponse>((resolve) => {
      const frame = iframeRef.current;
      if (!frame?.contentWindow) {
        resolve({ passed: false, error: "Pratinjau belum siap." });
        return;
      }
      const id = `check-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const timer = window.setTimeout(() => {
        pendingChecks.current.delete(id);
        resolve({ passed: false, error: "Pemeriksaan melebihi 2 detik." });
      }, 2000);
      pendingChecks.current.set(id, (result) => {
        window.clearTimeout(timer);
        resolve(result);
      });
      frame.contentWindow.postMessage(
        { source: "lecode-parent", type: "check", id, expression },
        "*",
      );
    });
  }, []);

  const evaluateChecks = useCallback(
    async (startedAt: number) => {
      const collected: CheckResult[] = [];

      for (let index = 0; index < checks.length; index += 1) {
        const check = checks[index];
        const response = await ask(check.args);
        const expected = parseJson(check.expected);
        const passed = response.passed && expected.ok && sameValue(response.value, expected.value);
        collected.push({
          index,
          description: check.description,
          isHidden: check.isHidden,
          passed,
          expected: check.expected,
          actual: response.error ?? JSON.stringify(response.value) ?? "undefined",
        });
      }

      setResults(collected);
      setDurationMs(Math.round(performance.now() - startedAt));
      setRunning(false);

      const allPassed = collected.length > 0 && collected.every((item) => item.passed);
      if (allPassed) {
        appendLine({ level: "system", text: "★ Semua pemeriksaan lolos. Tantangan selesai." });
        awardQuestion(question.slug, question.points);
        onSolved(question.points);
      } else if (collected.length > 0) {
        const passedCount = collected.filter((item) => item.passed).length;
        appendLine({
          level: "system",
          text: `# ${passedCount}/${collected.length} pemeriksaan lolos. Perbaiki lalu jalankan lagi.`,
        });
      }

      onContext?.({
        code: `<!-- index.html -->\n${files.html}\n\n/* styles.css */\n${files.css}\n\n// script.js\n${files.js}`,
        lastOutput: collected
          .map(
            (item) =>
              `Pemeriksaan ${item.index + 1}: ${item.passed ? "lolos" : `gagal (diharapkan ${item.expected}, hasil ${item.actual})`}`,
          )
          .join("; "),
      });
    },
    [appendLine, ask, checks, files, onContext, onSolved, question.points, question.slug],
  );

  const handleLoad = useCallback(() => {
    if (!awaitingRun.current) return;
    awaitingRun.current = false;
    const startedAt = performance.now();
    void evaluateChecks(startedAt);
  }, [evaluateChecks]);

  const run = useCallback(() => {
    if (running) return;
    setRunning(true);
    setResults(null);
    setLines([]);
    setDurationMs(null);
    appendLine({ level: "system", text: "$ pratinjau index.html dijalankan" });
    awaitingRun.current = true;
    setDoc(buildDoc(files));
    setRunId((current) => current + 1);
  }, [appendLine, files, running]);

  const reset = useCallback(() => {
    setFiles(initialFiles);
    setResults(null);
    setLines([]);
    setDurationMs(null);
    setDoc(buildDoc(initialFiles));
    setRunId((current) => current + 1);
    appendLine({ level: "system", text: "# berkas dikembalikan ke awal" });
  }, [appendLine, initialFiles]);

  const updateFile = (next: Partial<WebFiles>) => {
    const merged = { ...files, ...next };
    setFiles(merged);
    onContext?.({
      code: `<!-- index.html -->\n${merged.html}\n\n/* styles.css */\n${merged.css}\n\n// script.js\n${merged.js}`,
      lastOutput: "",
    });
  };

  const activeTab = TABS.find((item) => item.id === tab) ?? TABS[0];

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
        <span className="font-mono uppercase tracking-wider">Tantangan web</span>
        <span aria-hidden>·</span>
        <span className={cn("rounded border px-1.5 py-px font-medium", levelTone(question.difficulty))}>
          {levelLabel(question.difficulty)}
        </span>
        <span aria-hidden>·</span>
        <span className="font-mono">HTML · CSS · JS</span>
        {running && (
          <span className="inline-flex items-center gap-1 text-primary">
            <Loader2 className="h-3 w-3 animate-spin" /> menjalankan pratinjau
          </span>
        )}
      </div>

      <h2 className="mt-3 text-lg font-semibold leading-snug sm:text-xl">{question.title}</h2>
      <div className="mt-2 text-[14px] leading-7 text-muted">
        <Markdown content={question.prompt} />
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {/* Editor tiga berkas */}
        <div className="overflow-hidden rounded-md border border-border bg-[#111110]">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-pressed={tab === item.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-[11px] transition-colors",
                  tab === item.id
                    ? "bg-white/10 text-neutral-100"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200",
                )}
              >
                <Code2 className="h-3 w-3" /> {item.label}
              </button>
            ))}
            <span className="ml-auto truncate pl-2 font-mono text-[10px] text-neutral-500">{activeTab.filename}</span>
          </div>

          <CodeEditor
            value={files[tab]}
            onChange={(value) => updateFile({ [tab]: value } as Partial<WebFiles>)}
            onRun={run}
            onReset={reset}
            filename={activeTab.filename}
            ariaLabel={`Editor ${activeTab.label}`}
            placeholder={
              tab === "html"
                ? "<h1>Halo, LeCode!</h1>"
                : tab === "css"
                  ? "h1 { color: #2547d0; }"
                  : "console.log('Halo dari JavaScript');"
            }
            className="rounded-none border-0"
          />
        </div>

        {/* Pratinjau + console */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-md border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted">
                <Eye className="h-3.5 w-3.5" /> pratinjau
              </span>
              <span className="font-mono text-[10px] text-muted">
                {durationMs !== null ? `${durationMs} ms` : running ? "memuat…" : "siap"}
              </span>
            </div>
            <iframe
              key={runId}
              ref={iframeRef}
              title="Pratinjau hasil kode"
              sandbox="allow-scripts allow-modals"
              srcDoc={doc}
              onLoad={handleLoad}
              className="h-[260px] w-full border-0 bg-white"
            />
          </div>

          <div className="overflow-hidden rounded-md border border-border bg-[#111110]">
            <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
                <TerminalSquare className="h-3.5 w-3.5" /> console
              </span>
              <span className="font-mono text-[10px] text-neutral-500">{lines.length} baris</span>
            </div>
            <div className="h-[132px] overflow-auto px-3 py-2 font-mono text-[11.5px] leading-5">
              {lines.length === 0 ? (
                <p className="text-neutral-500">
                  Klik <span className="text-neutral-300">Jalankan</span> untuk melihat console.log() di sini.
                </p>
              ) : (
                lines.map((line, index) => (
                  <div
                    key={index}
                    className={cn(
                      "whitespace-pre-wrap break-words",
                      line.level === "error" && "text-rose-400",
                      line.level === "warn" && "text-amber-300",
                      line.level === "info" && "text-sky-300",
                      line.level === "system" && "text-teal-300",
                      line.level === "log" && "text-neutral-200",
                    )}
                  >
                    {line.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={run} disabled={running} className="btn-primary">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {running ? "Menjalankan…" : "Jalankan"}
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

      {results && results.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {results.map((result) => (
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
                  Pemeriksaan {result.index + 1} ·{" "}
                  {result.isHidden ? "tersembunyi" : result.description ?? "pemeriksaan"}
                </p>
                {!result.passed && !result.isHidden && (
                  <p className="mt-0.5 break-words font-mono text-[11px] opacity-80">
                    diharapkan {result.expected} · hasil {result.actual}
                  </p>
                )}
                {!result.passed && result.isHidden && (
                  <p className="mt-0.5 opacity-80">Hasil belum sesuai untuk pemeriksaan tambahan.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[12px] leading-6 text-amber-700 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Soal ini belum punya pemeriksaan otomatis. Pratinjau tetap bisa dijalankan.</p>
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
