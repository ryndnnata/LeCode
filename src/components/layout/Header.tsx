"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, MessageSquare, X } from "lucide-react";
import { MascotAvatar } from "@/components/brand/Mascot";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Beranda" },
  { href: "/belajar", label: "Belajar" },
  { href: "/game", label: "Game" },
  { href: "/roadmap", label: "Roadmap" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-bg">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          {/* Kiri atas: logo maskot bulat + wordmark */}
          <div className="flex min-w-0 items-center gap-2">
            <Logo />
          </div>

          {/* Navigasi utama (desktop) */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-muted hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="-mr-2.5 flex items-center gap-1.5">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="icon-btn"
              aria-label="Buka menu navigasi"
              aria-expanded={open}
              aria-controls="lecode-menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer kanan */}
      <aside
        id="lecode-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu LeCode"
        aria-hidden={!open}
        inert={!open}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-[min(92vw,340px)] flex-col border-l border-border bg-bg transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <MascotAvatar className="h-8 w-8" />
            <p className="text-sm font-medium">Menu</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="icon-btn" aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
                  isActive(item.href)
                    ? "bg-surface-2 font-medium text-fg"
                    : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="px-2 pb-2 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Bantuan
          </p>

          <Link
            href="/lapor"
            className="group flex items-start gap-3 rounded-md border border-border p-3 transition-colors hover:bg-surface-2"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-surface-2 text-fg">
              <MessageSquare className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-fg">Lapor / Saran</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                Bug, soal keliru, atau ide fitur.
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </aside>
    </>
  );
}
