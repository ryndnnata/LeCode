import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bug, Smartphone, Swords } from "lucide-react";
import { getGames, getQuestions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Game",
  description:
    "Game 2D LeCode: Let's defeat the boss melawan bos yang mendekat dan Touch the Bug. Bisa dimainkan di HP maupun PC langsung di browser.",
};

export const revalidate = 120;

export default async function GamePage() {
  const [games, questions] = await Promise.all([getGames(), getQuestions()]);
  const mcqCount = questions.filter((question) => question.type === "mcq").length;

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Belajar sambil menyerang.</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Dua game 2D yang menguji pemahamanmu tanpa terasa seperti ujian. Semua berjalan di browser, dengan
          kontrol sentuh untuk HP.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> Kontrol sentuh
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5" /> Keyboard
          </span>
          <span>Rekor tersimpan lokal</span>
        </div>
      </header>

      <div className="mt-8 grid gap-3 lg:grid-cols-2">
        {games.map((game) => {
          const isBoss = game.gameType === "boss";
          return (
            <Link
              key={game.slug}
              href={`/game/${game.slug}`}
              className="group overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-fg/30"
            >
              <div className={`relative h-44 border-b border-border ${isBoss ? "bg-[#111110]" : "bg-[#101210]"}`}>
                {isBoss ? (
                  <svg viewBox="0 0 480 220" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
                    <rect width="480" height="220" fill="#111110" />
                    <g stroke="#2a2a27" strokeWidth="1">
                      <line x1="0" y1="170" x2="480" y2="170" />
                      <line x1="0" y1="195" x2="480" y2="195" />
                    </g>
                    <circle cx="360" cy="108" r="42" fill="#1c1c1a" stroke="#f87171" strokeWidth="2" />
                    <circle cx="347" cy="100" r="5" fill="#f87171" />
                    <circle cx="373" cy="100" r="5" fill="#f87171" />
                    <path d="M345 122q15 9 30 0" stroke="#f87171" strokeWidth="2" fill="none" />
                    <g>
                      <circle cx="112" cy="142" r="12" fill="#e7e5e4" />
                      <rect x="100" y="156" width="24" height="20" rx="3" fill="#6e8cff" />
                    </g>
                    <rect x="34" y="34" width="140" height="6" rx="3" fill="#2a2a27" />
                    <rect x="34" y="34" width="96" height="6" rx="3" fill="#f87171" />
                    <text x="34" y="58" fill="#8a8880" fontFamily="monospace" fontSize="10">
                      boss_hp 68/100
                    </text>
                  </svg>
                ) : (
                  <svg viewBox="0 0 480 220" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
                    <rect width="480" height="220" fill="#101210" />
                    <g stroke="#23281f" strokeWidth="1">
                      {Array.from({ length: 11 }).map((_, index) => (
                        <line key={index} x1={index * 48} y1="0" x2={index * 48} y2="220" />
                      ))}
                      {Array.from({ length: 6 }).map((_, index) => (
                        <line key={`h${index}`} x1="0" y1={index * 44} x2="480" y2={index * 44} />
                      ))}
                    </g>
                    <text x="32" y="48" fill="#8a8880" fontFamily="monospace" fontSize="11">
                      def hitung(x):
                    </text>
                    <text x="52" y="70" fill="#5f5d56" fontFamily="monospace" fontSize="11">
                      return x * 2
                    </text>
                    {[
                      { x: 330, y: 62, r: 15 },
                      { x: 386, y: 122, r: 11 },
                      { x: 276, y: 142, r: 9 },
                    ].map((bug, index) => (
                      <g key={index}>
                        <circle cx={bug.x} cy={bug.y} r={bug.r} fill="#a3e635" />
                        <circle cx={bug.x - bug.r * 0.3} cy={bug.y - 2} r={bug.r * 0.18} fill="#101210" />
                        <circle cx={bug.x + bug.r * 0.3} cy={bug.y - 2} r={bug.r * 0.18} fill="#101210" />
                      </g>
                    ))}
                    <rect x="32" y="186" width="160" height="5" rx="2.5" fill="#23281f" />
                    <rect x="32" y="186" width="110" height="5" rx="2.5" fill="#a3e635" />
                  </svg>
                )}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded border border-white/15 bg-black/40 px-2 py-1 font-mono text-[10px] text-white">
                  {isBoss ? <Swords className="h-3 w-3" /> : <Bug className="h-3 w-3" />}
                  {isBoss ? "Arena bos" : "Refleks cepat"}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
                <div>
                  <h2 className="text-base font-medium">{game.title}</h2>
                  <p className="mt-1.5 text-[13px] leading-6 text-muted">{game.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
                    <span>{isBoss ? `${mcqCount} soal` : "45 detik"}</span>
                    {!isBoss && <span>{game.config.playerHp} nyawa</span>}
                    {isBoss && <span>{game.config.timeLimit}s / soal</span>}
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 border-t border-border pt-6 sm:grid-cols-3">
        {[
          { title: "Belajar aktif", desc: "Memori terbentuk saat kamu memutuskan, bukan hanya membaca." },
          { title: "Umpan balik cepat", desc: "Setiap jawaban langsung terlihat dampaknya di arena." },
          { title: "Bank soal sama", desc: "Soal diambil dari bank soal yang sama dengan modul belajar." },
        ].map((item) => (
          <div key={item.title}>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-[12px] leading-5 text-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
