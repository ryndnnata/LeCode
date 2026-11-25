import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Maximize2 } from "lucide-react";
import { BossBattle } from "@/components/game/BossBattle";
import { BugZap } from "@/components/game/BugZap";
import { getGameBySlug, getGames, getQuestions } from "@/lib/content";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game tidak ditemukan" };
  return { title: game.title, description: game.description };
}

export default async function GameDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const questions = await getQuestions();
  const others = (await getGames()).filter((item) => item.slug !== game.slug);
  const isBoss = game.gameType === "boss";

  const steps = isBoss
    ? [
        "Baca soal di bawah arena, lalu pilih jawaban.",
        "Jawaban benar mendorong bos mundur dan memberi damage.",
        "Jawaban salah membuat bos maju lebih cepat.",
        "Kalahkan bos sebelum jaraknya mencapai 100%.",
      ]
    : [
        "Ketuk atau klik bug yang muncul.",
        "Bug yang menyentuh baris kode mengurangi satu nyawa.",
        "Combo beruntun memberi poin ekstra.",
        "Kumpulkan skor tertinggi dalam 45 detik.",
      ];

  return (
    <div className="container-page py-8">
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/game" className="inline-flex items-center gap-1 transition-colors hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" /> Game
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-fg">{game.title}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {isBoss ? "Boss battle" : "Arcade"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{game.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{game.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isBoss && (
            <Link href={`/game/${game.slug}/arena`} className="btn-primary">
              <Maximize2 className="h-4 w-4" /> Main layar penuh
            </Link>
          )}
          <div className="flex gap-2 text-[11px] text-muted">
            {!isBoss && (
              <span className="rounded border border-border px-2 py-1">{game.config.playerHp} nyawa</span>
            )}
            <span className="rounded border border-border px-2 py-1">{game.config.timeLimit}s</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
        <div>{isBoss ? <BossBattle game={game} questions={questions} /> : <BugZap game={game} />}</div>

        <aside className="space-y-3">
          <div className="card p-4">
            <p className="text-sm font-medium">Cara main</p>
            <ol className="mt-3 space-y-2.5 text-[12px] leading-5 text-muted">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-2.5">
                  <span className="font-mono text-[10px] text-muted">0{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {others.length > 0 && (
            <div className="card p-4">
              <p className="text-sm font-medium">Game lainnya</p>
              <div className="mt-3 space-y-1.5">
                {others.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/game/${item.slug}`}
                    className="group flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-[12px] transition-colors hover:bg-surface-2"
                  >
                    {item.title}
                    <ArrowRight className="h-3.5 w-3.5 text-muted transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
