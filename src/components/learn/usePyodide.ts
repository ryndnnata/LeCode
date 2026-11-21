"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TestCase } from "@/lib/types";

export interface TestOutcome {
  index: number;
  description?: string;
  isHidden?: boolean;
  passed: boolean;
  expected: string;
  actual: string;
  log: string;
  error?: string;
}

export interface RunOutcome {
  ok: boolean;
  results: TestOutcome[];
  fatal?: string;
  durationMs: number;
}

type RunnerStatus = "idle" | "loading" | "ready" | "error";

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    const aArray = Array.isArray(a);
    const bArray = Array.isArray(b);
    if (aArray !== bArray) return false;
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
    );
  }
  return false;
}

function parseJson(value: string): { ok: boolean; value: unknown } {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false, value: value };
  }
}

const RUN_TIMEOUT_MS = 15000;

export function usePyodide() {
  const [status, setStatus] = useState<RunnerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const readyRef = useRef<Promise<void> | null>(null);
  const pendingRef = useRef(new Map<string, (data: unknown) => void>());

  const destroyWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    readyRef.current = null;
    pendingRef.current.clear();
  }, []);

  useEffect(() => () => destroyWorker(), [destroyWorker]);

  const ensureReady = useCallback((): Promise<void> => {
    if (readyRef.current) return readyRef.current;

    setStatus("loading");
    setError(null);

    readyRef.current = new Promise<void>((resolve, reject) => {
      let worker: Worker;
      try {
        worker = new Worker("/workers/pyodide.worker.js");
      } catch (workerError) {
        reject(new Error("Browser tidak mendukung Web Worker: " + String(workerError)));
        return;
      }

      const initId = `init-${Date.now()}`;
      worker.onmessage = (event: MessageEvent) => {
        const data = event.data as {
          id?: string;
          type?: string;
          error?: string;
          results?: unknown;
        };

        if (data.type === "ready" && data.id === initId) {
          setStatus("ready");
          resolve();
          return;
        }

        if (data.type === "fatal" && data.id === initId) {
          setStatus("error");
          setError(data.error ?? "Gagal memuat Python.");
          reject(new Error(data.error ?? "Gagal memuat Python."));
          return;
        }

        const resolver = data.id ? pendingRef.current.get(data.id) : undefined;
        if (resolver) {
          pendingRef.current.delete(data.id as string);
          resolver(data);
        }
      };

      worker.onerror = (event) => {
        const message = event.message || "Worker error";
        setStatus("error");
        setError(message);
        reject(new Error(message));
      };

      workerRef.current = worker;
      worker.postMessage({ id: initId, type: "init" });
    });

    return readyRef.current;
  }, []);

  const run = useCallback(
    async (code: string, functionName: string, testCases: TestCase[]): Promise<RunOutcome> => {
      const started = performance.now();
      try {
        await ensureReady();
        const worker = workerRef.current;
        if (!worker) throw new Error("Worker belum siap.");

        const id = `run-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const payload = {
          code,
          functionName,
          testCases: testCases.map((testCase, index) => ({
            index,
            args: testCase.args,
            expected: testCase.expected,
          })),
        };

        const response = await new Promise<{
          type?: string;
          error?: string;
          results?: Array<{
            index: number;
            ok: boolean;
            value: string | null;
            expected: string;
            stdout: string;
            error: string | null;
          }>;
        }>((resolve, reject) => {
          const timer = window.setTimeout(() => {
            pendingRef.current.delete(id);
            destroyWorker();
            setStatus("idle");
            reject(
              new Error(
                "Eksekusi melebihi 15 detik. Pastikan tidak ada loop tak berujung, lalu coba lagi.",
              ),
            );
          }, RUN_TIMEOUT_MS);

          pendingRef.current.set(id, (data) => {
            window.clearTimeout(timer);
            resolve(data as never);
          });

          worker.postMessage({ id, type: "run", payload });
        });

        if (response.type === "fatal") {
          destroyWorker();
          setStatus("idle");
          return {
            ok: false,
            results: [],
            fatal: response.error ?? "Terjadi kesalahan pada runtime Python.",
            durationMs: Math.round(performance.now() - started),
          };
        }

        const results: TestOutcome[] = (response.results ?? []).map((item) => {
          const testCase = testCases[item.index];
          const actualParsed = item.value !== null ? parseJson(item.value) : { ok: false, value: null };
          const expectedParsed = parseJson(item.expected);
          const passed =
            item.ok && actualParsed.ok && expectedParsed.ok && deepEqual(actualParsed.value, expectedParsed.value);

          return {
            index: item.index,
            description: testCase?.description,
            isHidden: testCase?.isHidden,
            passed,
            expected: item.expected,
            actual: item.value ?? "None",
            log: item.stdout,
            error: item.error ?? undefined,
          };
        });

        return {
          ok: results.length > 0 && results.every((result) => result.passed),
          results,
          durationMs: Math.round(performance.now() - started),
        };
      } catch (runError) {
        return {
          ok: false,
          results: [],
          fatal: runError instanceof Error ? runError.message : String(runError),
          durationMs: Math.round(performance.now() - started),
        };
      }
    },
    [destroyWorker, ensureReady],
  );

  return { run, status, error };
}
