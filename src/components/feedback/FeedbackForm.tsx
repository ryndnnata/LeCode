"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bug, CheckCircle2, Lightbulb, Loader2, MessageSquareHeart, Send } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { cn } from "@/lib/utils";

type Category = "laporan" | "saran";

export function FeedbackForm() {
  const [category, setCategory] = useState<Category>("laporan");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          category,
          message,
          pagePath: "/lapor",
        }),
      });
      const data = (await response.json()) as { ok: boolean; id?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Gagal mengirim laporan.");
      setTicket(data.id?.slice(-6).toUpperCase() ?? "OK");
      setStatus("done");
      setMessage("");
      setName("");
      setEmail("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Terjadi kesalahan.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="card p-6 sm:p-8">
        <span className="grid h-11 w-11 place-items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight">Laporan terkirim.</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          Laporanmu masuk ke antrean admin. Nomor tiket:{" "}
          <span className="font-mono text-fg">#{ticket}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setStatus("idle")} className="btn-primary">
            Kirim laporan lain
          </button>
          <Link href="/belajar" className="btn-ghost">
            Kembali belajar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <fieldset>
        <legend className="label">Jenis masukan</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { id: "laporan" as Category, label: "Lapor bug / kesalahan", icon: Bug, desc: "Soal keliru, error, tampilan rusak" },
            { id: "saran" as Category, label: "Saran fitur", icon: Lightbulb, desc: "Ide yang membuat LeCode lebih baik" },
          ].map((item) => {
            const Icon = item.icon;
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                aria-pressed={active}
                className={cn(
                  "flex items-start gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                  active
                    ? "border-fg/40 bg-surface-2"
                    : "border-border bg-surface hover:border-fg/25",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded border",
                    active
                      ? "border-transparent bg-fg text-bg"
                      : "border-border bg-surface-2 text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{item.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-4 text-muted">{item.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="feedback-name">
            Nama (opsional)
          </label>
          <input
            id="feedback-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="input"
            placeholder="Namamu atau panggilan"
            maxLength={80}
          />
        </div>
        <div>
          <label className="label" htmlFor="feedback-email">
            Email (opsional)
          </label>
          <input
            id="feedback-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="input"
            placeholder="agar kami bisa membalas"
            maxLength={120}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="feedback-message">
          Pesan
        </label>
        <textarea
          id="feedback-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={6}
          className="input resize-none"
          placeholder={
            category === "laporan"
              ? "Contoh: Soal 'FizzBuzz' di materi perulangan menampilkan output yang salah saat n=15..."
              : "Contoh: Tambahkan mode latihan wawancara kerja dengan timer..."
          }
          maxLength={4000}
          required
        />
        <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-muted">
          <span>Minimal 8 karakter. Detail lebih membantu kami.</span>
          <span className="font-mono">{message.length}/4000</span>
        </div>
      </div>

      {status === "error" && error && (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={status === "sending" || message.trim().length < 8} className="btn-primary">
          {status === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {status === "sending" ? "Mengirim…" : "Kirim laporan"}
        </button>
        <p className="text-[11px] leading-5 text-muted">Laporan masuk ke CMS admin dan tidak dipublikasikan.</p>
      </div>
    </form>
  );
}

export function FeedbackAside() {
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="border-b border-border p-5 text-center">
          <Mascot className="mx-auto w-28" />
          <p className="mt-2 text-[12px] leading-5 text-muted">
            &ldquo;Setiap laporanmu membuat LeCode lebih baik untuk semua pembelajar.&rdquo;
          </p>
          <p className="mt-1 text-[11px] font-medium text-fg">— Len</p>
        </div>
        <div className="p-4">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-medium">
            <MessageSquareHeart className="h-4 w-4 text-primary" /> Kami tindak lanjuti
          </p>
          <ul className="mt-2.5 space-y-2 text-[12px] leading-5 text-muted">
            <li className="flex gap-2">
              <span className="font-mono text-muted/70">1.</span> Laporan bug soal dicek maksimal 3 hari kerja.
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-muted/70">2.</span> Saran fitur masuk backlog dan diprioritaskan tiap sprint.
            </li>
            <li className="flex gap-2">
              <span className="font-mono text-muted/70">3.</span> Status laporan bisa dilihat admin di dashboard.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
