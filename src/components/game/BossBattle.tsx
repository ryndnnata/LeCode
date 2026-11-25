"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Phaser from "phaser";
import { Play, RotateCcw, Skull, Swords, Trophy, Zap } from "lucide-react";
import type { GameLevel, Question } from "@/lib/types";
import { Mascot } from "@/components/brand/Mascot";
import { Markdown } from "@/components/learn/Markdown";
import type { BossScene } from "./BossScene";
import { cn } from "@/lib/utils";

type Phase = "intro" | "playing" | "win" | "lose";

const DAMAGE = 12;
const TICK_MS = 100;
const HP_OPTIONS = [100, 500, 1000] as const;
type BossHpOption = (typeof HP_OPTIONS)[number];


function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function BossBattle({
  game,
  questions,
  fullscreen = false,
}: {
  game: GameLevel;
  questions: Question[];
  /** Mode arena: game dan panel soal berbagi satu layar tanpa scroll halaman. */
  fullscreen?: boolean;
}) {
  const quiz = useMemo(
    () => (questions.filter((question) => question.type === "mcq").length > 0
      ? questions.filter((question) => question.type === "mcq")
      : questions),
    [questions],
  );

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const answersRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BossScene | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const configuredHp = game.config.bossHp as BossHpOption;
  const initialBossHp: BossHpOption = HP_OPTIONS.includes(configuredHp) ? configuredHp : 100;

  const [phase, setPhase] = useState<Phase>("intro");
  const [maxHp, setMaxHp] = useState<BossHpOption>(initialBossHp);
  const [bossHp, setBossHp] = useState<number>(initialBossHp);
  const [distance, setDistance] = useState(0);
  const [index, setIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(game.config.timeLimit || 15);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "correct" | "wrong"; text: string } | null>(null);

  const [order, setOrder] = useState<number[]>(() => quiz.map((_, position) => position));

  const current = quiz[order[index % Math.max(1, order.length)]];


  useEffect(() => {
    let cancelled = false;
    let poll: number | null = null;

    (async () => {
      const PhaserModule = await import("phaser");
      const PhaserLib = ((PhaserModule as unknown as { default?: typeof PhaserModule }).default ??
        PhaserModule) as typeof PhaserModule;
      const { BossScene: BossSceneClass, bossSceneKey } = await import("./BossScene");
      if (cancelled || !arenaRef.current) return;

      const phaserGame = new PhaserLib.Game({
        type: PhaserLib.AUTO,
        parent: arenaRef.current,
        backgroundColor: "#111110",
        transparent: false,
        scale: {
          mode: PhaserLib.Scale.RESIZE,
          autoCenter: PhaserLib.Scale.CENTER_BOTH,
          width: "100%",
          height: "100%",
        },
        scene: [BossSceneClass],
        audio: { noAudio: true },
        banner: false,
      });

      gameRef.current = phaserGame;

      let attempts = 0;
      poll = window.setInterval(() => {
        const scene = phaserGame.scene.getScene(bossSceneKey) as BossScene | null;
        if (scene && scene.scene.isActive()) {
          sceneRef.current = scene;
          scene.setVisualState({ distance: 0, bossHp: initialBossHp, bossMaxHp: initialBossHp });
          if (poll) window.clearInterval(poll);
        }
        attempts += 1;
        if (attempts > 40 && poll) window.clearInterval(poll);
      }, 100);
    })();

    return () => {
      cancelled = true;
      if (poll) window.clearInterval(poll);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [initialBossHp]);


  useEffect(() => {
    sceneRef.current?.setVisualState({
      distance,
      bossHp,
      bossMaxHp: maxHp,
    });
  }, [distance, bossHp, maxHp]);

  const nextQuestion = useCallback(() => {
    setIndex((value) => value + 1);
    setSelected(null);
    setFeedback(null);
    setTimeLeft(game.config.timeLimit || 15);
  }, [game.config.timeLimit]);

  const handleAnswer = useCallback(
    (optionId: string, isCorrect: boolean) => {
      if (phase !== "playing" || feedback || !current) return;
      setSelected(optionId);

      if (isCorrect) {
        const damage = DAMAGE + combo * 3;
        setBossHp((value) => Math.max(0, value - damage));
        setDistance((value) => Math.max(0, value - 18 - combo * 2));
        setCombo((value) => value + 1);
        setScore((value) => value + 120 + combo * 15);
        setCorrectCount((value) => value + 1);
        setFeedback({ type: "correct", text: `+${damage} damage! Bos terpukul mundur.` });
        sceneRef.current?.playAttack(combo >= 2);
      } else {
        setDistance((value) => Math.min(100, value + 14));
        setCombo(0);
        setFeedback({
          type: "wrong",
          text: current.explanation ?? "Belum tepat — bos memanfaatkan celahmu!",
        });
        sceneRef.current?.playHurt();
      }

      timeoutRef.current = window.setTimeout(nextQuestion, 1500);
    },
    [combo, current, feedback, nextQuestion, phase],
  );


  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setTimeLeft((value) => Math.round((value - TICK_MS / 1000) * 10) / 10);
      setDistance((value) => Math.min(100, value + 0.5 * (game.config.bossSpeed || 1)));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [phase, game.config.bossSpeed]);


  useEffect(() => {
    if (phase !== "playing" || timeLeft > 0) return;
    setDistance((value) => Math.min(100, value + 10));
    setCombo(0);
    setFeedback({ type: "wrong", text: "Waktu habis! Bos memanfaatkan kelengahanmu." });
    sceneRef.current?.playHurt();
    timeoutRef.current = window.setTimeout(nextQuestion, 1400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);


  useEffect(() => {
    if (phase !== "playing") return;
    if (bossHp <= 0) {
      setPhase("win");
      sceneRef.current?.playVictory();
    } else if (distance >= 100) {
      setPhase("lose");
      sceneRef.current?.playDefeat();
    }
  }, [bossHp, distance, phase]);


   * Klik tombol jawaban yang benar-benar tampil, bukan memakai state di closure.
   * Dengan begitu pilihan selalu cocok dengan urutan yang dilihat pemain,
   * termasuk saat soal baru saja berganti. */
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      let number = Number(event.key);
      if (!Number.isInteger(number) || number < 1 || number > 9) {
        const code = /^(?:Digit|Numpad)([1-9])$/.exec(event.code);
        if (!code) return;
        number = Number(code[1]);
      }

      const buttons = answersRef.current?.querySelectorAll<HTMLButtonElement>("[data-answer-index]");
      const button = buttons?.[number - 1];
      if (!button || button.disabled) return;

      event.preventDefault();
      button.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const start = () => {
    setPhase("playing");
    setBossHp(maxHp);
    setDistance(0);
    setOrder(shuffle(quiz.map((_, position) => position)));
    setIndex(0);
    setCombo(0);
    setScore(0);
    setCorrectCount(0);
    setTimeLeft(game.config.timeLimit || 15);
    setSelected(null);
    setFeedback(null);
    sceneRef.current?.setVisualState({ distance: 0, bossHp: maxHp, bossMaxHp: maxHp });
  };

  const total = Math.max(1, quiz.length);
  const hpPercent = Math.max(0, (bossHp / maxHp) * 100);
  const timePercent = Math.max(0, (timeLeft / (game.config.timeLimit || 15)) * 100);

  return (
    <div
      className={cn(
        fullscreen
          ? "flex h-[calc(100dvh-3.5rem-1px)] flex-col overflow-hidden bg-bg md:flex-row"
          : "grid gap-4",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-[#111110]",
          fullscreen
            ? "min-h-0 flex-1 border-b border-border md:border-b-0 md:border-r"
            : "rounded-lg border border-border",
        )}
      >
        {/* Arena Phaser */}
        <div
          ref={arenaRef}
          className={fullscreen ? "absolute inset-0" : "h-[280px] w-full sm:h-[380px]"}
          aria-label="Arena boss battle"
        />

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="w-[52%] max-w-[280px]">
            <div className="flex items-center justify-between text-[10px] font-medium text-neutral-300">
              <span className="inline-flex items-center gap-1">
                <Skull className="h-3 w-3 text-rose-400" /> Bos Sintaks
              </span>
              <span className="font-mono">{Math.max(0, Math.ceil(bossHp))} HP</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded bg-black/50 px-2 py-0.5 font-mono text-[10px] text-neutral-200">
              {Math.max(0, timeLeft).toFixed(1)}s
            </span>
            {combo > 0 && (
              <span className="rounded bg-amber-400/20 px-2 py-0.5 font-mono text-[10px] font-medium text-amber-300">
                combo x{combo}
              </span>
            )}
          </div>
        </div>

        {/* Meter jarak */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-400">jarak bos</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-rose-500 transition-all duration-200"
                style={{ width: `${Math.min(100, distance)}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-neutral-400">{Math.round(distance)}%</span>
          </div>
        </div>

        {/* Overlay intro */}
        {phase === "intro" && (
          <div
            className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-[#111110]/95 text-center",
              fullscreen ? "gap-2 p-4" : "gap-3 p-6",
            )}
          >
            <Mascot className={fullscreen ? "w-14 shrink-0 sm:w-20" : "w-20 sm:w-24"} />
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">{game.title}</h2>
              <p className="mx-auto mt-2 max-w-md text-[12px] leading-6 text-neutral-300 sm:text-[13px]">
                {game.intro}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px]">
              <span className="mr-1 text-neutral-400">Nyawa bos</span>
              {HP_OPTIONS.map((hp) => (
                <button
                  key={hp}
                  type="button"
                  onClick={() => {
                    setMaxHp(hp);
                    setBossHp(hp);
                  }}
                  aria-pressed={maxHp === hp}
                  className={cn(
                    "rounded border px-2.5 py-1 font-mono transition-colors",
                    maxHp === hp
                      ? "border-white/40 bg-white/15 text-white"
                      : "border-white/15 text-neutral-400 hover:border-white/30 hover:text-white",
                  )}
                >
                  {hp}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-neutral-400">
              <span className="rounded border border-white/15 px-2 py-1">Benar = serang</span>
              <span className="rounded border border-white/15 px-2 py-1">Salah = bos maju</span>
              <span className="rounded border border-white/15 px-2 py-1">{game.config.timeLimit}s / soal</span>
            </div>
            <button type="button" onClick={start} className="btn-primary mt-1">
              <Play className="h-4 w-4" /> Mulai pertarungan
            </button>
          </div>
        )}

        {/* Overlay hasil */}
        {(phase === "win" || phase === "lose") && (
          <div
            className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#111110]/95 text-center",
              fullscreen ? "p-4" : "p-6",
            )}
          >
            <span
              className={cn(
                "grid h-12 w-12 place-items-center rounded-md",
                phase === "win" ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400",
              )}
            >
              {phase === "win" ? <Trophy className="h-6 w-6" /> : <Skull className="h-6 w-6" />}
            </span>
            <h2 className="text-xl font-semibold text-white">
              {phase === "win" ? "Bos dikalahkan." : "Kamu tumbang."}
            </h2>
            <p className="max-w-sm text-[12px] leading-6 text-neutral-300">
              {phase === "win"
                ? `Skor ${score} dengan ${correctCount} jawaban benar.`
                : "Bos terlalu dekat. Baca ulang materinya, lalu coba lagi."}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={start} className="btn-primary">
                <RotateCcw className="h-4 w-4" /> Main lagi
              </button>
              <a href="/belajar" className="btn-ghost border-white/20 bg-transparent text-white hover:bg-white/10">
                Belajar dulu
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Panel soal */}
      <div
        className={cn(
          "overflow-hidden bg-surface",
          fullscreen
            ? "flex h-[58dvh] shrink-0 flex-col border-t border-border md:h-full md:w-[360px] md:border-l md:border-t-0"
            : "rounded-lg border border-border",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
            <Swords className="h-3.5 w-3.5" />
            Soal {(index % total) + 1} / {total}
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${100 - timePercent}%` }}
              />
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-fg">
              <Zap className="h-3 w-3 text-amber-500" /> {score}
            </span>
          </div>
        </div>

        <div
          className={cn(
            fullscreen ? "arena-quiz min-h-0 flex-1 overflow-y-auto p-3" : "p-4 sm:p-5",
          )}
        >
          {current ? (
            <>
              <div className="text-[14px] leading-6">
                <Markdown content={current.prompt} />
              </div>

              <div
                ref={answersRef}
                className={cn("mt-4 grid gap-2", fullscreen ? "grid-cols-2" : "sm:grid-cols-2")}
              >
                {current.options?.map((option, optionIndex) => {
                  const isSelected = selected === option.id;
                  const revealed = Boolean(feedback);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      data-answer-index={optionIndex + 1}
                      disabled={phase !== "playing" || Boolean(feedback)}
                      onClick={() => handleAnswer(option.id, option.isCorrect)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md border border-border bg-surface text-left text-fg transition-colors",
                        fullscreen ? "px-2.5 py-2 text-[12px]" : "px-3 py-2.5 text-[12.5px]",
                        "hover:border-fg/30 disabled:cursor-default",
                        isSelected && feedback?.type === "correct" && "border-emerald-600/50 bg-emerald-500/5",
                        isSelected && feedback?.type === "wrong" && "border-rose-500/50 bg-rose-500/5",
                        revealed && !isSelected && option.isCorrect && "border-emerald-600/40 bg-emerald-500/5",
                      )}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded border border-border bg-surface-2 font-mono text-[10px] text-muted">
                        {optionIndex + 1}
                      </span>
                      <span className="flex-1">{option.text}</span>
                    </button>
                  );
                })}
              </div>

              {feedback && (
                <div
                  className={cn(
                    "mt-3 animate-pop rounded-md border px-3 py-2 text-[11.5px] leading-5",
                    feedback.type === "correct"
                      ? "border-emerald-600/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                      : "border-rose-500/30 bg-rose-500/5 text-rose-500",
                  )}
                >
                  {feedback.text}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">Belum ada soal untuk game ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
