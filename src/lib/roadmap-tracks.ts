import type { RoadmapNode } from "./types";

export type RoadmapTrackId = "web" | "game" | "data" | "full";

export interface RoadmapTrack {
  id: RoadmapTrackId;
  label: string;
  desc: string;
  outcome: string;
  /** Untuk siapa jalur ini paling cocok. */
  audience: string;
  icon: "globe" | "gamepad" | "database" | "layers";
  /** Urutan slug tahap. Kosong berarti seluruh roadmap. */
  slugs: string[];
}

export const roadmapTracks: RoadmapTrack[] = [
  {
    id: "web",
    label: "Web Developer",
    desc: "Bangun aplikasi yang dipakai orang banyak.",
    outcome: "Bisa merancang, membangun, dan men-deploy aplikasi web sendiri.",
    audience: "Cocok kalau kamu ingin membuat website, dashboard, atau aplikasi yang bisa dibuka lewat browser.",
    icon: "globe",
    slugs: [
      "fondasi-logika",
      "kontrol-alur",
      "fungsi-modular",
      "struktur-data",
      "string-parsing",
      "oop",
      "web-interaktif",
      "backend-database",
      "portofolio-karier",
    ],
  },
  {
    id: "game",
    label: "Game Developer",
    desc: "Ciptakan dunia interaktif sendiri.",
    outcome: "Bisa membuat game 2D lengkap dengan logika, physics, dan tampilan.",
    audience: "Cocok kalau kamu suka visual, cerita, dan penasaran bagaimana game sebenarnya dibuat.",
    icon: "gamepad",
    slugs: [
      "fondasi-logika",
      "kontrol-alur",
      "fungsi-modular",
      "struktur-data",
      "algoritma-dasar",
      "rekursi-divide",
      "oop",
      "game-dev",
      "portofolio-karier",
    ],
  },
  {
    id: "data",
    label: "Data & Backend",
    desc: "Olah data dan bangun layanan di balik layar.",
    outcome: "Bisa mengolah data, membuat API, dan mengelola database dengan benar.",
    audience: "Cocok kalau kamu suka angka, logika, dan sistem yang bekerja di balik layar aplikasi.",
    icon: "database",
    slugs: [
      "fondasi-logika",
      "kontrol-alur",
      "fungsi-modular",
      "struktur-data",
      "string-parsing",
      "algoritma-dasar",
      "rekursi-divide",
      "web-interaktif",
      "backend-database",
      "portofolio-karier",
    ],
  },
  {
    id: "full",
    label: "Semua tahap",
    desc: "Lihat seluruh peta belajar dari dasar sampai karier.",
    outcome: "Gambaran lengkap semua tahap tanpa memilih spesialisasi.",
    audience: "Cocok kalau kamu belum yakin mau ke mana dan ingin melihat semua kemungkinan dulu.",
    icon: "layers",
    slugs: [],
  },
];

export function getRoadmapTrack(id: string | null | undefined) {
  return roadmapTracks.find((track) => track.id === id);
}

/** Susun tahap sesuai urutan jalur (atau urutan `order` untuk semua tahap). */
export function buildRoadmapPlan(nodes: RoadmapNode[], track: RoadmapTrack): RoadmapNode[] {
  if (track.slugs.length === 0) {
    return [...nodes].sort((a, b) => a.order - b.order);
  }
  const map = new Map(nodes.map((node) => [node.slug, node]));
  return track.slugs
    .map((slug) => map.get(slug))
    .filter((node): node is RoadmapNode => Boolean(node));
}

/** Perkiraan durasi belajar, asumsi 45 menit per hari. */
export function estimateWeeks(stageCount: number) {
  return Math.max(1, Math.round(stageCount * 1.5));
}
