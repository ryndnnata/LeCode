"use client";

import { useEffect, useRef, useState } from "react";
import { Bug, Heart, Play, RotateCcw, Timer, Trophy, Zap } from "lucide-react";
import type { GameLevel } from "@/lib/types";
import { Mascot } from "@/components/brand/Mascot";
import { cn } from "@/lib/utils";

type Phase = "intro" | "playing" | "done";

interface BugItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  hue: number;
  label: string;
}

interface Zap {
  id: number;
  x: number;
  y: number;
}

const LABELS = ["TypeError", "NameError", "IndexError", "SyntaxError", "KeyError", "ValueError"];
const DURATION = 45;

export function BugZap({ game }: { game: GameLevel }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [bugs, setBugs] = useState<BugItem[]>([]);
  const [zaps, setZaps] = useState<Zap[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(game.config.playerHp || 3);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(game.config.timeLimit || DURATION);

  const bugsRef = useRef<BugItem[]>([]);
  const scoreRef = useRef(0);
  const stateRef = useRef({ lives: game.config.playerHp || 3, combo: 0, timeLeft: game.config.timeLimit || DURATION });

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("lecode:bugzap:best") ?? 0);
    if (saved > 0) setBest(saved);
  }, []);

  const start = () => {
    bugsRef.current = [];
    scoreRef.current = 0;
    setBugs([]);
    setZaps([]);
    setScore(0);
    setCombo(0);
    setLives(game.config.playerHp || 3);
    setTimeLeft(game.config.timeLimit || DURATION);
    stateRef.current = {
      lives: game.config.playerHp || 3,
      combo: 0,
      timeLeft: game.config.timeLimit || DURATION,
    };
    setPhase("playing");
  };

  /* Game loop */
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = performance.now();
    let spawnTimer = 0;
    let bugId = 1;
    let zapId = 1;

    const step = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const elapsed = DURATION - stateRef.current.timeLeft;
      const difficulty = 1 + elapsed / 35;

      stateRef.current.timeLeft = Math.max(0, stateRef.current.timeLeft - dt / 1000);
      setTimeLeft(stateRef.current.timeLeft);

      spawnTimer += dt;
      const spawnEvery = Math.max(420, 1150 - elapsed * 14);
      if (spawnTimer >= spawnEvery) {
        spawnTimer = 0;
        bugsRef.current.push({
          id: bugId++,
          x: 8 + Math.random() * 80,
          y: -8,
          speed: (8 + Math.random() * 5) * difficulty,
          size: 34 + Math.random() * 12,
          hue: [150, 45, 330, 190][Math.floor(Math.random() * 4)],
          label: LABELS[Math.floor(Math.random() * LABELS.length)],
        });
      }

      const survivors: BugItem[] = [];
      for (const bug of bugsRef.current) {
        const nextY = bug.y + (bug.speed * dt) / 1000;
        if (nextY >= 88) {
          stateRef.current.lives -= 1;
          stateRef.current.combo = 0;
          setLives(stateRef.current.lives);
          setCombo(0);
          continue;
        }
        survivors.push({ ...bug, y: nextY });
      }
      bugsRef.current = survivors;
      setBugs([...survivors]);

      if (stateRef.current.lives <= 0 || stateRef.current.timeLeft <= 0) {
        const finalScore = scoreRef.current;
        setPhase("done");
        setBest((current) => {
          const next = Math.max(current, finalScore);
          window.localStorage.setItem("lecode:bugzap:best", String(next));
          return next;
        });
        return;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const zapBug = (bug: BugItem) => {
    if (phase !== "playing") return;
    if (!bugsRef.current.some((item) => item.id === bug.id)) return;
    bugsRef.current = bugsRef.current.filter((item) => item.id !== bug.id);
    setBugs([...bugsRef.current]);

    const gained = 10 + stateRef.current.combo * 2;
    stateRef.current.combo += 1;
    setCombo(stateRef.current.combo);
    setScore((value) => value + gained);

    const zap = { id: Date.now() + bug.id, x: bug.x, y: bug.y };
    setZaps((current) => [...current, zap]);
    window.setTimeout(() => {
      setZaps((current) => current.filter((item) => item.id !== zap.id));
    }, 420);
  };

  const timePercent = Math.max(0, (timeLeft / (game.config.timeLimit || DURATION)) * 100);

  return (
    <div className="grid gap-4">
      <div className="relative overflow-hidden rounded-lg border border-border bg-[#101210]">
        {/* Latar grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(163,230,53,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(163,230,53,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* HUD */}
        <div className="pointer-events-none relative z-20 flex items-start justify-between p-3 sm:p-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: game.config.playerHp || 3 }).map((_, index) => (
              <Heart
                key={index}
                className={cn("h-3.5 w-3.5", index < lives ? "fill-rose-500 text-rose-500" : "text-neutral-600")}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-200">
            <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-0.5">
              <Timer className="h-3 w-3" /> {Math.ceil(timeLeft)}s
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-black/40 px-2 py-0.5">
              <Zap className="h-3 w-3 text-amber-300" /> {score}
            </span>
            {combo > 1 && (
              <span className="rounded bg-amber-400/20 px-2 py-0.5 text-amber-300">x{combo}</span>
            )}
          </div>
        </div>

        {/* Area bug */}
        <div className="relative h-[300px] w-full sm:h-[400px]">
          {bugs.map((bug) => (
            <button
              key={bug.id}
              type="button"
              onClick={() => zapBug(bug)}
              onPointerDown={() => zapBug(bug)}
              className="absolute grid -translate-x-1/2 -translate-y-1/2 touch-manipulation select-none place-items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              style={{
                left: `${bug.x}%`,
                top: `${bug.y}%`,
                width: Math.max(46, bug.size),
                height: Math.max(46, bug.size),
              }}
              aria-label={`Ketuk bug ${bug.label}`}
            >
              <span className="relative grid place-items-center" style={{ width: bug.size, height: bug.size }}>
                <span
                  className="absolute inset-0 rounded-full opacity-25 blur-md"
                  style={{ background: `hsl(${bug.hue} 90% 55%)` }}
                />
                <svg viewBox="0 0 48 48" className="relative h-full w-full drop-shadow-lg">
                  <g stroke={`hsl(${bug.hue} 85% 60%)`} strokeWidth="2.6" strokeLinecap="round">
                    <path d="M12 16 4 10M12 24H2M12 32 4 38M36 16l8-6M36 24h10M36 32l8 6" />
                  </g>
                  <ellipse cx="24" cy="26" rx="12" ry="14" fill={`hsl(${bug.hue} 80% 55%)`} />
                  <ellipse cx="24" cy="16" rx="9" ry="8" fill={`hsl(${bug.hue} 80% 48%)`} />
                  <circle cx="20.5" cy="15" r="2.6" fill="#07121a" />
                  <circle cx="27.5" cy="15" r="2.6" fill="#07121a" />
                  <path d="M24 8v-4M19 8l-2-4M29 8l2-4" stroke={`hsl(${bug.hue} 85% 62%)`} strokeWidth="2" strokeLinecap="round" />
                  <path d="M24 20v18" stroke="#07121a" strokeWidth="1.4" opacity="0.55" />
                  <circle cx="20" cy="30" r="2" fill="#07121a" opacity="0.4" />
                  <circle cx="28" cy="34" r="1.6" fill="#07121a" opacity="0.4" />
                </svg>
              </span>
            </button>
          ))}

          {zaps.map((zap) => (
            <span
              key={zap.id}
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-lime-300/60"
              style={{ left: `${zap.x}%`, top: `${zap.y}%`, width: 54, height: 54 }}
            />
          ))}

          {/* Baris kode */}
          <div className="absolute inset-x-3 bottom-3 rounded-md border border-white/10 bg-[#0b0d0b]/95 px-3 py-2 font-mono text-[10px] leading-5 text-neutral-400 sm:text-[11px]">
            <p>
              <span className="text-fuchsia-300">def</span> <span className="text-teal-300">hitung</span>
              <span className="text-neutral-400">(x):</span>
            </p>
            <p className="pl-3">
              <span className="text-fuchsia-300">return</span> x <span className="text-amber-300">*</span> 2
            </p>
            <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-lime-400"
                style={{ width: `${100 - timePercent}%` }}
              />
            </div>
          </div>
        </div>

        {phase === "intro" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#101210]/95 p-6 text-center">
            <Mascot className="w-20" />
            <div>
              <h2 className="text-xl font-semibold text-white">{game.title}</h2>
              <p className="mx-auto mt-2 max-w-sm text-[12px] leading-6 text-neutral-300">{game.intro}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-neutral-400">
              <span className="rounded border border-white/15 px-2 py-1">Ketuk bug = +10 poin</span>
              <span className="rounded border border-white/15 px-2 py-1">Bug lolos = -1 nyawa</span>
              <span className="rounded border border-white/15 px-2 py-1">{DURATION} detik</span>
            </div>
            <button type="button" onClick={start} className="btn-primary mt-1">
              <Play className="h-4 w-4" /> Mulai Touch the Bug
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-[#101210]/95 p-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-md bg-amber-400/15 text-amber-300">
              <Trophy className="h-6 w-6" />
            </span>
            <h2 className="text-xl font-semibold text-white">{score} poin</h2>
            <p className="text-[12px] text-neutral-300">
              Rekor terbaikmu: <span className="font-medium text-amber-300">{Math.max(best, score)}</span>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={start} className="btn-primary">
                <RotateCcw className="h-4 w-4" /> Main lagi
              </button>
              <a href="/game" className="btn-ghost border-white/20 bg-transparent text-white hover:bg-white/10">
                Game lain
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3">
        <p className="inline-flex items-center gap-2 text-[12px] text-muted">
          <Bug className="h-4 w-4 text-lime-600 dark:text-lime-400" />
          Ketuk bug sebelum menyentuh baris kode. Cocok dimainkan di HP.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span className="rounded border border-border px-2 py-0.5">Rekor {Math.max(best, score)}</span>
          <span
            className={cn(
              "rounded border border-border px-2 py-0.5",
              combo > 2 && "border-amber-500/40 text-amber-600 dark:text-amber-400",
            )}
          >
            Combo x{combo}
          </span>
        </div>
      </div>
    </div>
  );
}
