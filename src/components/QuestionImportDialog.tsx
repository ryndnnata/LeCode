"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Table2,
  Upload,
  X,
} from "lucide-react";
import { importQuestionsAction, type ImportQuestionsResult } from "@/app/actions/admin";
import { IMPORT_HEADERS, parseImportRows, type ParsedImportRow } from "@/lib/question-import";import { downloadQuestionTemplate } from "@/lib/question-template";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 60;

export function QuestionImportDialog({
  lessons,
  onClose,
  onImported,
}: {
  lessons: { slug: string; title: string }[];
  onClose: () => void;
  onImported: (result: ImportQuestionsResult) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedImportRow[] | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportQuestionsResult | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !importing) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [importing, onClose]);

  const downloadTemplate = async () => {
    setDownloading(true);
    setFileError(null);
    try {
      await downloadQuestionTemplate(lessons);
    } catch (error) {
      console.error("[LeCode] Gagal membuat template:", error);
      setFileError("Gagal membuat template. Coba muat ulang halaman.");
    } finally {
      setDownloading(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setParsing(true);
    setFileError(null);
    setFatal(null);
    setRows(null);
    setResult(null);
    setFileName(file.name);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName =
        workbook.SheetNames.find((name) => name.toLowerCase() === "soal") ?? workbook.SheetNames[0];
      if (!sheetName) {
        setFatal("File tidak punya sheet apa pun. Gunakan template LeCode.");
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: false,
      });
      const parsed = parseImportRows(json, lessons);
      setFatal(parsed.fatal ?? null);
      setRows(parsed.rows);
      if (parsed.rows.length === 0 && !parsed.fatal) {
        setFileError("Tidak ada baris data yang terbaca. Pastikan sheet \"Soal\" terisi.");
      }
    } catch (error) {
      console.error("[LeCode] Gagal membaca file:", error);
      setFileError("File tidak bisa dibaca. Gunakan format .xlsx, .xls, atau .csv.");
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const validRows = (rows ?? []).filter((row) => row.errors.length === 0);
  const invalidCount = (rows ?? []).length - validRows.length;

  const runImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const response = await importQuestionsAction(validRows.map((row) => row.input));
      setResult(response);
      if (response.imported > 0) onImported(response);
    } catch (error) {
      console.error("[LeCode] Gagal mengimpor soal:", error);
      setResult({
        ok: false,
        imported: 0,
        skipped: 0,
        renamed: 0,
        issues: [],
        error: "Impor gagal. Periksa koneksi lalu coba lagi.",
      });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setRows(null);
    setFatal(null);
    setFileError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="fixed inset-0 z-[65] flex overflow-y-auto bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="card m-auto w-full max-w-4xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface-2">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <div>
              <h2 id="import-title" className="text-sm font-medium">
                Impor soal dari Excel
              </h2>
              <p className="mt-0.5 text-[11.5px] text-muted">
                Unggah file .xlsx, .xls, atau .csv sesuai template.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn h-9 w-9"
            aria-label="Tutup impor"
            disabled={importing}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto p-5">
          {/* Hasil impor */}
          {result ? (
            <div className="space-y-4">
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-md border px-4 py-3 text-[12.5px] leading-5",
                  result.ok
                    ? "border-emerald-500/30 bg-emerald-500/[0.07]"
                    : "border-rose-500/30 bg-rose-500/[0.07]",
                )}
              >
                {result.ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <div>
                  <p className="font-medium">{result.message ?? result.error ?? "Impor selesai."}</p>
                  <p className="mt-0.5 text-muted">
                    {result.imported} berhasil · {result.skipped} dilewati
                    {result.renamed > 0 ? ` · ${result.renamed} slug disesuaikan` : ""}
                  </p>
                </div>
              </div>

              {result.issues.length > 0 && (
                <div className="rounded-md border border-border">
                  <p className="border-b border-border bg-surface-2 px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                    Baris yang dilewati
                  </p>
                  <ul className="max-h-56 divide-y divide-border overflow-y-auto">
                    {result.issues.map((issue, index) => (
                      <li key={`${issue.title}-${index}`} className="px-3 py-2 text-[12px]">
                        <p className="font-medium">{issue.title}</p>
                        <p className="mt-0.5 text-muted">{issue.error}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={reset} className="btn-ghost">
                  <Upload className="h-3.5 w-3.5" /> Impor file lain
                </button>
                <button type="button" onClick={onClose} className="btn-primary">
                  Selesai
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Unduh template */}
              <div className="rounded-md border border-border bg-surface-2/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-md">
                    <p className="text-[12.5px] font-medium">Belum punya file?</p>
                    <p className="mt-1 text-[12px] leading-5 text-muted">
                      Unduh template berisi contoh soal kuis dan kode, daftar kolom, serta daftar{" "}
                      <code className="rounded bg-surface px-1 py-0.5 font-mono text-[11px]">materi_slug</code> yang
                      tersedia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="btn-ghost"
                    disabled={downloading}
                  >
                    {downloading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Unduh template
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {IMPORT_HEADERS.map((header) => (
                    <code
                      key={header}
                      className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {header}
                    </code>
                  ))}
                </div>
              </div>

              {/* Pilih file */}
              <label
                htmlFor="import-file"
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-8 text-center transition-colors hover:border-fg/30 hover:bg-surface-2/50",
                  parsing && "pointer-events-none opacity-70",
                )}
              >
                {parsing ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted" />
                ) : (
                  <Upload className="h-6 w-6 text-muted" />
                )}
                <span className="text-[12.5px] font-medium">
                  {parsing ? "Membaca file…" : fileName ? "Ganti file" : "Pilih file Excel"}
                </span>
                <span className="text-[11.5px] text-muted">
                  {fileName ?? "Format .xlsx, .xls, atau .csv · maksimal 500 soal"}
                </span>
                <input
                  ref={inputRef}
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>

              {(fileError || fatal) && (
                <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/[0.07] px-3.5 py-2.5 text-[12px] leading-5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{fatal ?? fileError}</span>
                </div>
              )}

              {/* Pratinjau */}
              {rows && rows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                    <span className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-2 px-2 py-1 font-medium">
                      <Table2 className="h-3.5 w-3.5" /> {rows.length} baris terbaca
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/30 bg-emerald-500/[0.07] px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {validRows.length} siap
                    </span>
                    {invalidCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded border border-rose-500/30 bg-rose-500/[0.07] px-2 py-1 font-medium text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-3.5 w-3.5" /> {invalidCount} perlu perbaikan
                      </span>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-md border border-border">
                    <div className="hidden grid-cols-[56px_minmax(0,1fr)_70px_90px] gap-3 border-b border-border bg-surface-2 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted sm:grid">
                      <span>Baris</span>
                      <span>Soal</span>
                      <span>Tipe</span>
                      <span>Status</span>
                    </div>
                    <div className="max-h-72 divide-y divide-border overflow-y-auto">
                      {rows.slice(0, PREVIEW_LIMIT).map((row) => {
                        const ok = row.errors.length === 0;
                        return (
                          <div key={row.row} className="px-3 py-2.5">
                            <div className="grid gap-1.5 sm:grid-cols-[56px_minmax(0,1fr)_70px_90px] sm:items-center sm:gap-3">
                              <span className="font-mono text-[11px] text-muted">#{row.row}</span>
                              <div className="min-w-0">
                                <p className="truncate text-[12.5px] font-medium">{row.title}</p>
                                <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                                  {row.input.slug} · {row.input.lessonSlug || "materi belum diisi"}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium",
                                  row.type === "code"
                                    ? "border-accent/25 bg-accent/10 text-accent"
                                    : "border-primary/25 bg-primary/10 text-primary",
                                )}
                              >
                                {row.type === "code" ? "Kode" : "Kuis"}
                              </span>
                              <span
                                className={cn(
                                  "w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium",
                                  ok
                                    ? "border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-700 dark:text-emerald-300"
                                    : "border-rose-500/30 bg-rose-500/[0.07] text-rose-600 dark:text-rose-400",
                                )}
                              >
                                {ok ? "Siap" : "Perbaiki"}
                              </span>
                            </div>
                            {row.errors.length > 0 && (
                              <ul className="mt-1.5 space-y-0.5 pl-0 text-[11px] leading-5 text-rose-600 dark:text-rose-400 sm:pl-[68px]">
                                {row.errors.map((error, index) => (
                                  <li key={index}>• {error}</li>
                                ))}
                              </ul>
                            )}
                            {row.warnings.length > 0 && (
                              <ul className="mt-1 space-y-0.5 text-[11px] leading-5 text-amber-600 dark:text-amber-400 sm:pl-[68px]">
                                {row.warnings.map((warning, index) => (
                                  <li key={index}>• {warning}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {rows.length > PREVIEW_LIMIT && (
                      <p className="border-t border-border bg-surface-2 px-3 py-2 text-[11px] text-muted">
                        Menampilkan {PREVIEW_LIMIT} baris pertama dari {rows.length}. Semua baris tetap ikut
                        diimpor.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <p className="text-[11px] leading-5 text-muted">
                  Hanya baris berstatus <strong className="font-medium text-fg">Siap</strong> yang diimpor.
                  {invalidCount > 0 ? " Perbaiki file lalu unggah ulang." : ""}
                </p>
                <div className="flex gap-2">
                  {rows && rows.length > 0 && (
                    <button type="button" onClick={reset} className="btn-ghost" disabled={importing}>
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={runImport}
                    className="btn-primary"
                    disabled={importing || validRows.length === 0}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {importing ? "Mengimpor…" : `Impor ${validRows.length} soal`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
