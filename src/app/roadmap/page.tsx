import type { Metadata } from "next";
import { RoadmapBoard } from "@/components/roadmap/RoadmapBoard";
import { getRoadmap } from "@/lib/content";
import { roadmapTracks } from "@/lib/roadmap-tracks";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "Pilih tujuan belajarmu, lalu lihat urutan tahap yang jelas: dari fondasi logika sampai spesialisasi web, game, atau backend. Lengkap dengan prasyarat dan estimasi waktu.",
};

export const revalidate = 120;

export default async function RoadmapPage() {
  const nodes = await getRoadmap();
  const stages = Array.from(new Set(nodes.map((node) => node.stage)));

  return (
    <div className="container-page py-10 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tidak perlu bingung harus belajar apa.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Pilih satu tujuan belajar dulu. Roadmap lengkap dengan prasyarat, estimasi waktu, dan langkah
          berikutnya.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
          <span className="font-mono">{roadmapTracks.length} jalur</span>
          <span className="font-mono">{nodes.length} tahap</span>
          <span className="font-mono">{stages.length} fase</span>
          <span>Progres tersimpan otomatis</span>
        </div>
      </header>

      <div className="mt-8">
        <RoadmapBoard nodes={nodes} />
      </div>
    </div>
  );
}
