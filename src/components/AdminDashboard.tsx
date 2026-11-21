"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Braces,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileQuestion,
  FileSpreadsheet,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
  MessageSquareHeart,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import type { FeedbackItem, Question } from "@/lib/types";
import type { QuestionInput } from "@/app/actions/admin";
import {
  deleteQuestionAction,
  logoutAction,
  saveQuestionAction,
  updateFeedbackStatusAction,
  type ImportQuestionsResult,
} from "@/app/actions/admin";
import { downloadQuestionTemplate } from "@/lib/question-template";
import { cn, formatDate, levelLabel, levelTone } from "@/lib/utils";
import { QuestionEditor } from "./QuestionEditor";
import { QuestionImportDialog } from "./QuestionImportDialog";

type Tab = "soal" | "feedback" | "panduan";

const feedbackStatusLabel: Record<FeedbackItem["status"], string> = {
  baru: "Baru",
  dibaca: "Dibaca",
  selesai: "Selesai",
};

export function AdminDashboard({
  questions,
  lessons,
  feedback,
  mode,
  ai,
}: {
  questions: Question[];
  lessons: { slug: string; title: string }[];
  feedback: FeedbackItem[];
  mode: { sanity: boolean; writable: boolean };
  ai: { id: string; label: string; model: string } | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("soal");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const notify = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  };

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return questions;
    return questions.filter(
      (question) =>
        question.title.toLowerCase().includes(term) ||
        question.slug.includes(term) ||
        question.lessonSlug.includes(term),
    );
  }, [questions, query]);

  const lessonTitle = (slug: string) => lessons.find((lesson) => lesson.slug === slug)?.title ?? slug;

  const stats = {
    total: questions.length,
    code: questions.filter((question) => question.type === "code").length,
    mcq: questions.filter((question) => question.type === "mcq").length,
    baru: feedback.filter((item) => item.status === "baru").length,
  };

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 900);
  };

  const handleSave = async (input: QuestionInput) => {
    const result = await saveQuestionAction(input);
    if (result.ok) {
      notify("ok", result.message ?? "Soal tersimpan.");
      router.refresh();
    }
    return result;
  };

  const handleDelete = async (question: Question) => {
    if (!window.confirm(`Hapus soal "${question.title}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(question._id);
    const result = await deleteQuestionAction(question._id);
    setBusyId(null);
    if (result.ok) {
      notify("ok", result.message ?? "Soal dihapus.");
      router.refresh();
    } else {
      notify("err", result.error ?? "Gagal menghapus soal.");
    }
  };

  const handleImported = (result: ImportQuestionsResult) => {
    if (result.imported > 0) {
      notify("ok", result.message ?? `${result.imported} soal diimpor.`);
      router.refresh();
    } else {
      notify("err", result.error ?? "Tidak ada soal yang diimpor.");
    }
  };

  const handleTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadQuestionTemplate(lessons);
    } catch (error) {
      console.error("[LeCode] Gagal mengunduh template:", error);
      notify("err", "Gagal mengunduh template. Coba lagi.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleStatus = async (item: FeedbackItem, status: FeedbackItem["status"]) => {
    setBusyId(item._id);
    const result = await updateFeedbackStatusAction(item._id, status);
    setBusyId(null);
    if (result.ok) {
      notify("ok", "Status feedback diperbarui.");
      router.refresh();
    } else {
      notify("err", result.error ?? "Gagal memperbarui status.");
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof FileQuestion }[] = [
    { id: "soal", label: "Bank soal", icon: FileQuestion },
    { id: "feedback", label: `Feedback (${feedback.length})`, icon: MessageSquareHeart },
    { id: "panduan", label: "Panduan", icon: Settings2 },
  ];

  return (
    <div className="container-page py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker inline-flex items-center gap-1.5">
            <LayoutDashboard className="h-3.5 w-3.5" /> Admin & CMS
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Dashboard LeCode</h1>
          <p className="mt-1.5 text-sm text-muted">Kelola bank soal, tinjau laporan, dan atur konten.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={refresh} className="btn-ghost" disabled={refreshing}>
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Segarkan
          </button>
          <Link href="/" className="btn-ghost">
            <ExternalLink className="h-3.5 w-3.5" /> Lihat situs
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost text-rose-600 dark:text-rose-400" title="Keluar dari admin">
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </button>
          </form>
        </div>
      </div>

      {/* Status koneksi */}
      <div
        className={cn(
          "mt-6 flex items-start gap-2.5 rounded-md border px-4 py-3 text-[12px] leading-5",
          mode.sanity && mode.writable
            ? "border-emerald-500/30 bg-emerald-500/[0.07] text-fg"
            : "border-amber-500/30 bg-amber-500/[0.07] text-fg",
        )}
      >
        <Database
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            mode.sanity && mode.writable ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
          )}
        />
        {mode.sanity && mode.writable ? (
          <span>
            Terhubung ke <strong className="font-medium">Sanity</strong> — perubahan tersimpan permanen di dataset.
          </span>
        ) : mode.sanity ? (
          <span>
            Sanity terhubung tetapi <strong className="font-medium">token tulis belum diisi</strong>. Tambahkan{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">SANITY_API_WRITE_TOKEN</code>{" "}
            untuk menyimpan permanen.
          </span>
        ) : (
          <span>
            <strong className="font-medium">Mode demo</strong>, Sanity belum dikonfigurasi. Perubahan tersimpan di
            memori server dan hilang saat restart. Lihat tab <strong className="font-medium">Panduan</strong>.
          </span>
        )}
      </div>

      {/* Statistik */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total soal", value: stats.total, icon: FileQuestion, tint: "text-fg" },
          { label: "Pilihan ganda", value: stats.mcq, icon: BookOpenCheck, tint: "text-accent" },
          { label: "Tantangan kode", value: stats.code, icon: Braces, tint: "text-fg" },
          { label: "Feedback baru", value: stats.baru, icon: Inbox, tint: "text-amber-600 dark:text-amber-400" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-wider text-muted">{card.label}</p>
                <Icon className={cn("h-4 w-4", card.tint)} />
              </div>
              <p className="mt-2 font-mono text-2xl font-medium">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Tab */}
      <div className="mt-7 flex gap-5 overflow-x-auto border-b border-border">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-0.5 pb-2.5 pt-1 text-xs font-medium transition-colors",
                tab === item.id
                  ? "border-fg text-fg"
                  : "border-transparent text-muted hover:text-fg",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </button>
          );
        })}
      </div>

      {tab === "soal" && (
        <div className="mt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="input pl-9"
                placeholder="Cari soal berdasarkan judul, slug, atau materi…"
                aria-label="Cari soal"
              />
            </div>
            <button
              type="button"
              onClick={handleTemplate}
              className="btn-ghost"
              disabled={downloadingTemplate}
              title="Unduh template Excel untuk impor soal"
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Template
            </button>
            <button type="button" onClick={() => setShowImport(true)} className="btn-ghost">
              <FileSpreadsheet className="h-4 w-4" /> Impor Excel
            </button>
            <button type="button" onClick={() => setEditing("new")} className="btn-primary">
              <Plus className="h-4 w-4" /> Tambah soal
            </button>
          </div>

          <div className="card mt-4 overflow-hidden">
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_130px_90px_84px] gap-3 border-b border-border bg-surface-2 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-muted md:grid">
              <span>Soal</span>
              <span>Tipe</span>
              <span>Materi</span>
              <span>Level</span>
              <span className="text-right">Aksi</span>
            </div>
            <div className="divide-y divide-border">
              {filtered.map((question) => (
                <div
                  key={question._id}
                  className="grid gap-2 px-4 py-3 transition-colors hover:bg-surface-2/60 md:grid-cols-[minmax(0,1fr)_100px_130px_90px_84px] md:items-center md:gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{question.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                      {question.slug}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      question.type === "code"
                        ? "border-accent/25 bg-accent/10 text-accent"
                        : "border-primary/25 bg-primary/10 text-primary",
                    )}
                  >
                    {question.type === "code" ? "Kode" : "Kuis"}
                  </span>
                  <span className="truncate text-[11.5px] text-muted">{lessonTitle(question.lessonSlug)}</span>
                  <span
                    className={cn(
                      "w-fit rounded border px-1.5 py-0.5 text-[10px] font-medium",
                      levelTone(question.difficulty),
                    )}
                  >
                    {levelLabel(question.difficulty)}
                  </span>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing(question)}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted transition-colors hover:border-fg/30 hover:text-fg"
                      aria-label={`Ubah ${question.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(question)}
                      disabled={busyId === question._id}
                      className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted transition-colors hover:border-rose-500/40 hover:text-rose-500 disabled:opacity-50"
                      aria-label={`Hapus ${question.title}`}
                    >
                      {busyId === question._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-14 text-center">
                  <FileQuestion className="mx-auto h-7 w-7 text-muted/60" />
                  <p className="mt-2 text-sm font-medium">Tidak ada soal yang cocok</p>
                  <p className="mt-1 text-[12px] text-muted">Ubah kata kunci atau tambahkan soal baru.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "feedback" && (
        <div className="mt-5 space-y-3">
          {feedback.map((item) => (
            <div key={item._id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      item.category === "laporan"
                        ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "border-primary/25 bg-primary/10 text-primary",
                    )}
                  >
                    {item.category}
                  </span>
                  <span className="text-[12.5px] font-medium">{item.name}</span>
                  {item.email && <span className="text-[11px] text-muted">{item.email}</span>}
                  <span className="font-mono text-[10.5px] text-muted">{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {busyId === item._id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
                  <select
                    value={item.status}
                    onChange={(event) => handleStatus(item, event.target.value as FeedbackItem["status"])}
                    className="rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] text-fg focus:border-fg/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    aria-label={`Status feedback dari ${item.name}`}
                  >
                    {Object.entries(feedbackStatusLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2.5 whitespace-pre-wrap text-[13px] leading-6 text-muted">{item.message}</p>
            </div>
          ))}
          {feedback.length === 0 && (
            <div className="card px-4 py-14 text-center">
              <Inbox className="mx-auto h-7 w-7 text-muted/60" />
              <p className="mt-2 text-sm font-medium">Belum ada feedback</p>
              <p className="mt-1 text-[12px] text-muted">
                Laporan dari menu <strong className="font-medium text-fg">Lapor/Saran</strong> akan muncul di sini.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "panduan" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="card p-5 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Asisten AI Len</p>
              <span
                className={cn(
                  "rounded border px-2 py-0.5 text-[10px] font-medium",
                  ai
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400",
                )}
              >
                {ai ? `Aktif · ${ai.label}` : "Fallback lokal"}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-muted">
              {ai ? (
                <>
                  Terhubung ke <strong className="font-medium text-fg">{ai.label}</strong> dengan model{" "}
                  <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">{ai.model}</code>.
                </>
              ) : (
                "Belum ada API key. Len tetap menjawab memakai fallback lokal berbasis aturan."
              )}
            </p>
            <p className="mt-3 text-[12px] leading-5 text-muted">
              Atur di Vercel → <strong className="font-medium text-fg">Settings → Environment Variables</strong>{" "}
              (atau <code className="font-mono text-fg">.env.local</code>), lalu redeploy:
            </p>
            <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-[#111110] p-3 font-mono text-[10.5px] leading-5 text-neutral-300">
{`AI_PROVIDER=gemini        # atau: groq / openai
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash

# Alternatif Groq:
# GROQ_API_KEY=...
# GROQ_MODEL=llama-3.3-70b-versatile`}
            </pre>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              Tanpa <code className="font-mono">AI_PROVIDER</code>, urutan deteksi: Gemini → Groq →
              OpenAI-compatible. API key hanya dibaca di server dan tidak pernah dikirim ke browser.
            </p>
          </div>

          <div className="card p-5">
            <p className="text-sm font-medium">Menyambungkan Sanity</p>
            <ol className="mt-3 space-y-3 text-[12.5px] leading-6 text-muted">
              <li>
                <strong className="font-medium text-fg">1.</strong> Buat project di{" "}
                <a
                  href="https://sanity.io/manage"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  sanity.io/manage
                </a>{" "}
                lalu salin Project ID.
              </li>
              <li>
                <strong className="font-medium text-fg">2.</strong> Isi environment variable di Vercel /{" "}
                <code className="font-mono text-fg">.env.local</code>:
                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-[#111110] p-3 font-mono text-[10.5px] leading-5 text-neutral-300">
{`NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=sk...`}
                </pre>
              </li>
              <li>
                <strong className="font-medium text-fg">3.</strong> Buka{" "}
                <Link href="/studio" className="text-primary hover:underline">
                  /studio
                </Link>{" "}
                untuk membuat dokumen <code className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[11px]">lesson</code>{" "}
                terlebih dahulu, lalu tambah soal dari dashboard ini.
              </li>
              <li>
                <strong className="font-medium text-fg">4.</strong> Token tulis dibuat di Sanity → API → Tokens dengan
                role Editor.
              </li>
            </ol>
          </div>

          <div className="card p-5">
            <p className="text-sm font-medium">Skema konten</p>
            <div className="mt-3 space-y-2 text-[12px] text-muted">
              {[
                { name: "lesson", desc: "Materi: judul, slug, topik, level, konten markdown" },
                { name: "question", desc: "Kuis atau tantangan kode + options/testCases" },
                { name: "gameLevel", desc: "Konfigurasi game dan daftar soal" },
                { name: "roadmapNode", desc: "Tahap roadmap, prasyarat, resource" },
                { name: "feedback", desc: "Laporan & saran dari pengguna" },
                { name: "siteSettings", desc: "Teks beranda & prompt AI" },
              ].map((schema) => (
                <div key={schema.name} className="rounded-md border border-border bg-surface-2 px-3 py-2">
                  <code className="block font-mono text-[11px] text-primary">{schema.name}</code>
                  <span className="mt-0.5 block text-[11.5px] leading-5">{schema.desc}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11.5px] leading-5 text-muted">
              Mode gelap/terang dashboard mengikuti tombol tema di header. Pengaturan tema Sanity Studio tersedia di
              menu Studio → Appearance.
            </p>
          </div>

          <div className="card p-5 lg:col-span-2">
            <p className="text-sm font-medium">Alur kerja admin</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Plus, title: "Tambah", desc: "Buat soal baru dari dashboard atau Sanity Studio." },
                { icon: Pencil, title: "Ubah", desc: "Perbarui instruksi, pilihan jawaban, atau test case." },
                { icon: Trash2, title: "Hapus", desc: "Hapus soal yang tidak relevan; langsung hilang dari situs." },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-md border border-border bg-surface-2 p-3">
                    <Icon className="h-4 w-4 text-muted" />
                    <p className="mt-2 text-[12.5px] font-medium">{step.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-muted">{step.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/studio" className="btn-ghost">
                <ExternalLink className="h-3.5 w-3.5" /> Buka Sanity Studio
              </Link>
              <Link href="/lapor" className="btn-ghost">
                <MessageSquareHeart className="h-3.5 w-3.5" /> Uji form laporan
              </Link>
            </div>
          </div>
        </div>
      )}

      {editing !== null && (
        <QuestionEditor
          question={editing === "new" ? null : editing}
          lessons={lessons}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {showImport && (
        <QuestionImportDialog
          lessons={lessons}
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}

      {toast && (
        <div
          role="status"
          className={cn(
            "fixed bottom-4 left-4 right-4 z-[70] flex items-center gap-2 rounded-md border px-4 py-3 text-[12.5px] font-medium sm:left-auto sm:right-5 sm:max-w-sm",
            toast.type === "ok"
              ? "border-emerald-500/40 bg-surface text-emerald-700 dark:text-emerald-300"
              : "border-rose-500/40 bg-surface text-rose-600 dark:text-rose-400",
          )}
        >
          {toast.type === "ok" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Trash2 className="h-4 w-4 shrink-0" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}
