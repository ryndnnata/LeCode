"use client";

import { useCallback, useEffect, useState } from "react";

export interface ProgressState {
  xp: number;
  solved: string[];
  roadmapDone: string[];
  streak: number;
  lastActive: string;
}

const STORAGE_KEY = "lecode:progress:v1";
const EVENT = "lecode:progress";

const emptyState: ProgressState = {
  xp: 0,
  solved: [],
  roadmapDone: [],
  streak: 0,
  lastActive: "",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function readProgress(): ProgressState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      xp: Number(parsed.xp) || 0,
      solved: Array.isArray(parsed.solved) ? parsed.solved : [],
      roadmapDone: Array.isArray(parsed.roadmapDone) ? parsed.roadmapDone : [],
      streak: Number(parsed.streak) || 0,
      lastActive: parsed.lastActive || "",
    };
  } catch {
    return emptyState;
  }
}

function writeProgress(next: ProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function awardQuestion(slug: string, points: number) {
  const current = readProgress();
  const alreadySolved = current.solved.includes(slug);
  const today = todayKey();
  const streak =
    current.lastActive === today
      ? current.streak
      : current.lastActive === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
        ? current.streak + 1
        : 1;

  writeProgress({
    xp: current.xp + (alreadySolved ? Math.round(points / 4) : points),
    solved: alreadySolved ? current.solved : [...current.solved, slug],
    roadmapDone: current.roadmapDone,
    streak,
    lastActive: today,
  });
}

export function toggleRoadmapNode(slug: string) {
  const current = readProgress();
  const done = current.roadmapDone.includes(slug);
  writeProgress({
    ...current,
    roadmapDone: done
      ? current.roadmapDone.filter((item) => item !== slug)
      : [...current.roadmapDone, slug],
    lastActive: current.lastActive || todayKey(),
  });
}

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(emptyState);

  const sync = useCallback(() => setProgress(readProgress()), []);

  useEffect(() => {
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  return progress;
}
