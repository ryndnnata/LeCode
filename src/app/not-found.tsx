import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <Mascot className="w-32" />
      <p className="section-kicker mt-5">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Halaman ini belum ditulis.</h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        Mungkin tautannya salah, atau materi ini sedang disusun Len. Coba kembali ke beranda atau lihat daftar
        materi.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-primary">
          <Home className="h-4 w-4" /> Beranda
        </Link>
        <Link href="/belajar" className="btn-ghost">
          <Compass className="h-4 w-4" /> Lihat materi
        </Link>
      </div>
    </div>
  );
}
