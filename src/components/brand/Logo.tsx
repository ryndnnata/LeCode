import Link from "next/link";
import { MascotAvatar } from "@/components/brand/Mascot";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return <MascotAvatar className={cn("h-8 w-8 shrink-0", className)} />;
}

export function Logo({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2.5", className)}
      aria-label="LeCode — kembali ke beranda"
    >
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[17px] font-semibold tracking-tight text-fg">
            LeCode
          </span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Learn Code
          </span>
        </span>
      )}
    </Link>
  );
}
