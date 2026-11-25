"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Circle,
  Compass,
  Database,
  Gamepad2,
  Globe2,
  Layers,
  Lock,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import type { RoadmapNode } from "@/lib/types";
import { toggleRoadmapNode, useProgress } from "@/lib/progress";
import {
  buildRoadmapPlan,
  estimateWeeks,
  getRoadmapTrack,
  roadmapTracks,
  type RoadmapTrack,
  type RoadmapTrackId,
} from "@/lib/roadmap-tracks";
import { cn } from "@/lib/utils";

const TRACK_STORAGE_KEY = "lecode:roadmap:track:v1";

const trackIcons = {
  globe: Globe2,
  gamepad: Gamepad2,
  database: Database,
  layers: Layers,
};

const stageNotes: Record<string, string> = {
  Fondasi: "Dasar wajib: logika, alur program, dan fungsi.",
  Menengah: "Mulai berpikir seperti programmer.",
  Mahir: "Pola untuk masalah yang lebih besar.",
  Spesialisasi: "Dalami bidang yang kamu pilih.",
};

interface Group {
  stage: string;
  items: RoadmapNode[];
}

function groupByStage(planned: RoadmapNode[]): Group[] {
  const groups: Group[] = [];
  for (const node of planned) {
    const last = groups[groups.length - 1];
    if (last && last.stage === node.stage) last.items.push(node);
    else groups.push({ stage: node.stage, items: [node] });
  }
  return groups;
}

export function RoadmapBoard({ nodes }: { nodes: RoadmapNode[] }) {
  const progress = useProgress();
  const done = progress.roadmapDone;

  // undefined = belum tahu pilihan tersimpan (menunggu mount), null = belum memilih.
  const [trackId, setTrackId] = useState<string | null | undefined>(undefined);
  const [pendingId, setPendingId] = useState<RoadmapTrackId | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(TRACK_STORAGE_KEY);
    } catch {
      saved = null;
    }
    setTrackId(saved && getRoadmapTrack(saved) ? saved : null);
  }, []);

  const track = getRoadmapTrack(trackId ?? null);

  const chooseTrack = (id: RoadmapTrackId) => {
    try {
      window.localStorage.setItem(TRACK_STORAGE_KEY, id);
    } catch {
      // localStorage bisa diblokir; pilihan tetap berlaku selama sesi ini.
    }
    setTrackId(id);
    setPendingId(null);
  };

  const changeTrack = (current: RoadmapTrackId) => {
    try {
      window.localStorage.removeItem(TRACK_STORAGE_KEY);
    } catch {
      // abaikan
    }
    setPendingId(current);
    setTrackId(null);
  };

  if (trackId === undefined) {
    return <div className="min-h-[420px]" aria-hidden />;
  }

  if (!track) {
    return (
      <TrackChooser
        nodes={nodes}
        pendingId={pendingId}
        onPending={setPendingId}
        onConfirm={chooseTrack}
      />
    );
  }

  return (
    <RoadmapResult
      nodes={nodes}
      track={track}
      done={done}
      onChangeTrack={() => changeTrack(track.id)}
    />
  );
}

function TrackChooser({
  nodes,
  pendingId,
  onPending,
  onConfirm,
}: {
  nodes: RoadmapNode[];
  pendingId: RoadmapTrackId | null;
  onPending: (id: RoadmapTrackId) => void;
  onConfirm: (id: RoadmapTrackId) => void;
}) {
  const selected = getRoadmapTrack(pendingId);
  const selectedPlan = selected ? buildRoadmapPlan(nodes, selected) : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-medium">Pilih tujuan belajarmu dulu</h2>
        </div>
        <p className="mt-1.5 max-w-xl text-[12.5px] leading-5 text-muted">
          Roadmap baru akan ditampilkan setelah kamu memilih. Setiap jalur sudah disusun berurutan, jadi kamu
          tidak perlu menebak harus mulai dari mana.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {roadmapTracks.map((track) => {
            const plan = buildRoadmapPlan(nodes, track);
            const Icon = trackIcons[track.icon];
            const active = pendingId === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => onPending(track.id)}
                aria-pressed={active}
                className={cn(
                  "group flex h-full flex-col rounded-lg border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "border-primary/50 bg-primary/[0.05] ring-1 ring-primary/30"
                    : "border-border bg-surface hover:border-fg/30 hover:bg-surface-2/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "grid h-9 w-9 place-items-center rounded-md border",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-surface-2 text-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={cn(
                      "grid h-4 w-4 place-items-center rounded-full border",
                      active ? "border-primary bg-primary text-bg" : "border-border text-transparent",
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                </div>

                <p className="mt-3 text-sm font-medium">{track.label}</p>
                <p className="mt-1 text-[12px] leading-5 text-muted">{track.desc}</p>
                <p className="mt-2 text-[11px] leading-4 text-muted/80">{track.audience}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="chip font-mono">{plan.length} tahap</span>
                  <span className="chip font-mono">±{estimateWeeks(plan.length)} minggu</span>
                </div>

                <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-4 text-muted">
                  <span className="font-medium text-fg">Hasil akhir:</span> {track.outcome}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-[72px] lg:self-start">
        <div className="card p-4">
          <p className="text-sm font-medium">Ringkasan pilihan</p>
          {selected ? (
            <>
              <p className="mt-2.5 text-[12.5px] font-medium">{selected.label}</p>
              <p className="mt-1 text-[11.5px] leading-5 text-muted">{selected.audience}</p>
              <p className="mt-1.5 text-[11.5px] leading-5 text-muted">
                <span className="font-medium text-fg">Hasil akhir:</span> {selected.outcome}
              </p>
              <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-[11.5px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Jumlah tahap</dt>
                  <dd className="font-mono">{selectedPlan.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Estimasi</dt>
                  <dd className="font-mono">±{estimateWeeks(selectedPlan.length)} minggu</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-muted">Mulai dari</dt>
                  <dd className="truncate text-right">{selectedPlan[0]?.title ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-muted">Berakhir di</dt>
                  <dd className="truncate text-right">
                    {selectedPlan[selectedPlan.length - 1]?.title ?? "—"}
                  </dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="mt-2 text-[12px] leading-5 text-muted">
              Belum ada jalur yang dipilih. Klik salah satu kartu di samping untuk melihat ringkasannya.
            </p>
          )}

          <button
            type="button"
            onClick={() => selected && onConfirm(selected.id)}
            disabled={!selected}
            className="btn-primary mt-4 w-full"
          >
            <Target className="h-4 w-4" /> Tampilkan roadmap
          </button>
          <p className="mt-2 text-[10.5px] leading-4 text-muted">
            Bisa diganti kapan saja. Progres yang sudah kamu tandai tidak hilang.
          </p>
        </div>

        <div className="card p-4">
          <p className="text-sm font-medium">Cara pakai</p>
          <ol className="mt-2 space-y-2 text-[11.5px] leading-5 text-muted">
            <li>1. Pilih tujuan yang paling dekat dengan impianmu.</li>
            <li>2. Ikuti urutan tahap dari atas ke bawah.</li>
            <li>3. Tandai tahap selesai agar progres tercatat.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function RoadmapResult({
  nodes,
  track,
  done,
  onChangeTrack,
}: {
  nodes: RoadmapNode[];
  track: RoadmapTrack;
  done: string[];
  onChangeTrack: () => void;
}) {
  const planned = useMemo(() => buildRoadmapPlan(nodes, track), [nodes, track]);
  const groups = useMemo(() => groupByStage(planned), [planned]);
  const planSlugs = useMemo(() => new Set(planned.map((node) => node.slug)), [planned]);

  const positionBySlug = useMemo(
    () => new Map(planned.map((node, index) => [node.slug, index + 1])),
    [planned],
  );

  const doneInPlan = planned.filter((node) => done.includes(node.slug)).length;
  const percent = planned.length > 0 ? Math.round((doneInPlan / planned.length) * 100) : 0;
  const weeks = estimateWeeks(planned.length);

  const isBlocked = (node: RoadmapNode) =>
    node.prerequisites.some((slug) => planSlugs.has(slug) && !done.includes(slug));

  const outsidePrereqs = (node: RoadmapNode) =>
    node.prerequisites.filter((slug) => !planSlugs.has(slug));

  const nextNode =
    planned.find((node) => !done.includes(node.slug) && !isBlocked(node)) ??
    planned.find((node) => !done.includes(node.slug));

  const nodeTitle = (slug: string) => nodes.find((node) => node.slug === slug)?.title ?? slug;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="section-kicker inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" /> Roadmap pilihanmu
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{track.label}</h2>
          <p className="mt-1 max-w-xl text-[13px] leading-6 text-muted">{track.outcome}</p>
          <p className="mt-1 max-w-xl text-[11.5px] leading-5 text-muted/80">{track.audience}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip font-mono">{planned.length} tahap</span>
            <span className="chip font-mono">±{weeks} minggu</span>
            <span className="chip font-mono">{groups.length} fase</span>
            <span className="chip">
              {doneInPlan}/{planned.length} selesai
            </span>
          </div>
        </div>
        <button type="button" onClick={onChangeTrack} className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Ganti tujuan
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium">Arah jalur</p>
          <span className="font-mono text-[10px] text-muted">
            {planned.length} tahap · dari {planned[0]?.title ?? "—"} sampai{" "}
            {planned[planned.length - 1]?.title ?? "—"}
          </span>
        </div>
        <ol className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {planned.map((node, index) => {
            const isDone = done.includes(node.slug);
            const isNext = nextNode?.slug === node.slug;
            return (
              <li key={node.slug} className="flex shrink-0 items-center gap-1">
                <span
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px]",
                    isDone
                      ? "border-emerald-600/30 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400"
                      : isNext
                        ? "border-primary/40 bg-primary/[0.06] text-primary"
                        : "border-border bg-surface-2 text-muted",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-4 w-4 shrink-0 place-items-center rounded-full font-mono text-[9px]",
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isNext
                          ? "bg-primary/15 text-primary"
                          : "bg-fg/5 text-muted",
                    )}
                  >
                    {isDone ? <Check className="h-2.5 w-2.5" /> : index + 1}
                  </span>
                  <span className="whitespace-nowrap">{node.title}</span>
                </span>
                {index < planned.length - 1 && (
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted/50" aria-hidden />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {nextNode ? (
            <div className="card overflow-hidden border-primary/30">
              <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/[0.06] px-4 py-2.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-primary">
                  Langkah berikutnya
                </p>
                <span className="ml-auto font-mono text-[10px] text-muted">
                  Tahap {positionBySlug.get(nextNode.slug)} dari {planned.length}
                </span>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-medium">{nextNode.title}</h3>
                  <span className="chip">{nextNode.stage}</span>
                </div>
                <p className="mt-1.5 text-[13px] leading-6 text-muted">{nextNode.description}</p>
                {nextNode.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {nextNode.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={nextNode.resources[0]?.url ?? "/belajar"}
                    className="btn-primary"
                  >
                    {nextNode.resources[0] ? "Buka materi" : "Mulai belajar"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleRoadmapNode(nextNode.slug)}
                    className="btn-ghost"
                  >
                    <Check className="h-4 w-4" /> Tandai selesai
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-emerald-600/30 bg-emerald-500/[0.04] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">Seluruh jalur {track.label} sudah selesai 🎉</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-muted">
                    Keren. Sekarang saatnya membangun proyek nyata atau mencoba jalur lain untuk memperluas
                    skill.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/belajar" className="btn-primary">
                      <BookOpen className="h-4 w-4" /> Latihan lagi
                    </Link>
                    <button type="button" onClick={onChangeTrack} className="btn-ghost">
                      <Compass className="h-4 w-4" /> Pilih jalur lain
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {groups.map((group) => {
            const groupDone = group.items.filter((node) => done.includes(node.slug)).length;
            return (
              <section key={group.stage}>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-fg">{group.stage}</h3>
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[10px] text-muted">
                    {groupDone}/{group.items.length}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted">{stageNotes[group.stage] ?? ""}</p>

                <ol className="mt-3">
                  {group.items.map((node) => {
                    const position = positionBySlug.get(node.slug) ?? 0;
                    const isDone = done.includes(node.slug);
                    const locked = !isDone && isBlocked(node);
                    const isNext = nextNode?.slug === node.slug;
                    const outside = outsidePrereqs(node);

                    return (
                      <li key={node.slug} className="flex gap-3 sm:gap-4">
                        <div className="flex flex-col items-center">
                          <span
                            className={cn(
                              "grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-[11px]",
                              isDone
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : isNext
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-surface-2 text-muted",
                            )}
                          >
                            {isDone ? <Check className="h-3.5 w-3.5" /> : position}
                          </span>
                          {position < planned.length && (
                            <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
                          )}
                        </div>

                        <div
                          className={cn(
                            "mb-2.5 min-w-0 flex-1 rounded-lg border bg-surface p-4 transition-colors sm:p-5",
                            isDone
                              ? "border-emerald-600/30 bg-emerald-500/[0.03]"
                              : isNext
                                ? "border-primary/40"
                                : "border-border",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-medium">{node.title}</h4>
                                {isDone && (
                                  <span className="inline-flex items-center gap-1 rounded border border-emerald-600/30 px-1.5 py-px text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                                    <Check className="h-3 w-3" /> selesai
                                  </span>
                                )}
                                {isNext && (
                                  <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-[10px] font-medium text-primary">
                                    <Play className="h-3 w-3" /> berikutnya
                                  </span>
                                )}
                                {locked && (
                                  <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-px text-[10px] text-muted">
                                    <Lock className="h-3 w-3" /> prasyarat
                                  </span>
                                )}
                              </div>
                              <p className="mt-1.5 text-[13px] leading-6 text-muted">{node.description}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleRoadmapNode(node.slug)}
                              aria-pressed={isDone}
                              aria-label={
                                isDone
                                  ? `Tandai ${node.title} belum selesai`
                                  : `Tandai ${node.title} selesai`
                              }
                              className={cn(
                                "grid h-7 w-7 shrink-0 place-items-center rounded border transition-colors",
                                isDone
                                  ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "border-border text-muted hover:border-fg/40 hover:text-fg",
                              )}
                            >
                              {isDone ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                            </button>
                          </div>

                          {node.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {node.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          {(node.prerequisites.length > 0 || outside.length > 0) && (
                            <p className="mt-2.5 text-[10.5px] leading-5 text-muted">
                              {node.prerequisites.some((slug) => planSlugs.has(slug)) && (
                                <>
                                  Prasyarat:{" "}
                                  {node.prerequisites
                                    .filter((slug) => planSlugs.has(slug))
                                    .map(nodeTitle)
                                    .join(", ")}
                                </>
                              )}
                              {outside.length > 0 && (
                                <>
                                  {node.prerequisites.some((slug) => planSlugs.has(slug)) ? " · " : ""}
                                  Butuh juga: {outside.map(nodeTitle).join(", ")}{" "}
                                  <span className="opacity-70">(di luar jalur ini)</span>
                                </>
                              )}
                            </p>
                          )}

                          {node.resources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border pt-3">
                              {node.resources.map((resource) => (
                                <Link
                                  key={resource.url + resource.label}
                                  href={resource.url}
                                  className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                                >
                                  <BookOpen className="h-3 w-3" /> {resource.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>

        <aside className="space-y-3 xl:sticky xl:top-[72px] xl:self-start">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Progres jalur</p>
              <span className="font-mono text-[11px] text-muted">{percent}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {doneInPlan} dari {planned.length} tahap selesai. Tersimpan otomatis di browser ini.
            </p>

            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {groups.map((group) => {
                const groupDone = group.items.filter((node) => done.includes(node.slug)).length;
                const groupPercent =
                  group.items.length > 0 ? (groupDone / group.items.length) * 100 : 0;
                return (
                  <div key={group.stage}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted">{group.stage}</span>
                      <span className="font-mono text-muted">
                        {groupDone}/{group.items.length}
                      </span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full bg-fg/40" style={{ width: `${groupPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-sm font-medium">Biar tidak bingung</p>
            <p className="mt-1 text-[11.5px] leading-5 text-muted">
              Ikuti urutan dari langkah berikutnya. Setiap tahap punya tautan materi dan latihan yang bisa
              langsung dibuka.
            </p>
            <Link href="/belajar" className="btn-ghost mt-3 w-full">
              <BookOpen className="h-3.5 w-3.5" /> Buka daftar materi
            </Link>
            <button type="button" onClick={onChangeTrack} className="btn-ghost mt-2 w-full">
              <ArrowLeft className="h-3.5 w-3.5" /> Ganti tujuan
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
