import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Belajar",
    links: [
      { label: "Semua materi", href: "/belajar" },
      { label: "Kuis pilihan ganda", href: "/belajar?tipe=mcq" },
      { label: "Tantangan kode", href: "/belajar?tipe=code" },
    ],
  },
  {
    title: "Bermain",
    links: [{ label: "Semua game", href: "/game" }],
  },
  {
    title: "LeCode",
    links: [
      { label: "Roadmap", href: "/roadmap" },
      { label: "Lapor / Saran", href: "/lapor" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="container-page py-10">
        <Logo />

        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{column.title}</p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className="text-sm text-muted transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-5 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} LeCode.</p>
        </div>
      </div>
    </footer>
  );
}
