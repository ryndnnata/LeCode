import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Bot, Gamepad2, Map } from "lucide-react";
import { MascotAvatar } from "@/components/brand/Mascot";

export const revalidate = 120;

const features = [
  {
    title: "Belajar",
    href: "/belajar",
    icon: BookOpen,
    desc: "Kuis pilihan ganda sampai menulis kode sendiri, dengan terminal Python di browser.",
  },
  {
    title: "AI Assistant",
    href: "/belajar",
    icon: Bot,
    desc: "Bertanya ke AI jika kamu butuh sesuatu.",
  },
  {
    title: "Game",
    href: "/game",
    icon: Gamepad2,
    desc: "Belajar sambil bermain.",
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    icon: Map,
    desc: "Urutan belajar yang jelas, dari fondasi sampai spesialisasi.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="border-b border-border">
        <div className="container-page py-12 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="max-w-xl text-3xl font-semibold leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
              LeCode siap menemani belajarmu
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-muted">
              Jika bingung untuk memulai, ingat LeCode :D
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Link href="/belajar" className="btn-primary">
                Mulai belajar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/roadmap" className="btn-ghost">
                Lihat roadmap
              </Link>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
              <MascotAvatar className="h-10 w-10 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">Kenalan dengan Len</p>
                <p className="mt-1 text-[13px] leading-6 text-muted">
                  Asisten belajarmu di LeCode. Klik tombol Tanya Len di kanan bawah.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 BAGIAN */}
      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Empat bagian</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Satu alur, empat cara belajar.</h2>
          </div>
          <Link href="/belajar" className="text-sm text-muted transition-colors hover:text-fg">
            Semua materi
          </Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                href={feature.href}
                className="group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-fg/30 sm:p-5"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-fg">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{feature.title}</span>
                  <span className="mt-1 block text-[13px] leading-6 text-muted">{feature.desc}</span>
                </span>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
