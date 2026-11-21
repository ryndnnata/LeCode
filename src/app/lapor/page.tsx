import type { Metadata } from "next";
import { FeedbackAside, FeedbackForm } from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "Lapor / Saran",
  description:
    "Temukan bug, soal yang keliru, atau punya ide fitur? Kirim laporan atau saran untuk LeCode di sini.",
};

export default function LaporPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="max-w-2xl">
          <p className="section-kicker">Lapor / Saran</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Bantu kami membuat LeCode lebih baik.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Ada soal yang keliru, error saat menjalankan kode, atau ide game baru? Semua masukan masuk ke CMS
            admin dan ditinjau langsung.
          </p>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <FeedbackForm />
          <FeedbackAside />
        </div>
      </div>
    </div>
  );
}
