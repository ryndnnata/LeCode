"use client";

import { useEffect, useState } from "react";
import { MascotAvatar } from "@/components/brand/Mascot";
import type { Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AiAssistant } from "./AiAssistant";
import type { LenRuntimeContext } from "./len-context";


export function LenDock({
  question,
  context,
  hideAtXl = false,
}: {
  question?: Question;
  context?: LenRuntimeContext;
  hideAtXl?: boolean;
}) {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      {/* Tombol melayang: kanan bawah, hanya ikon bot */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Tanya Len"
        title="Tanya Len"
        className={cn(
          "fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-border bg-surface text-fg transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg md:bottom-6 md:right-6",
          hideAtXl && "xl:hidden",
        )}
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <MascotAvatar className="h-7 w-7" />
      </button>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
          hideAtXl && "xl:hidden",
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Bottom sheet (mobile) / drawer kanan (desktop) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 h-[82dvh] rounded-t-lg border-t border-border bg-bg transition-transform duration-200 md:inset-x-auto md:inset-y-0 md:right-0 md:h-full md:w-[400px] md:rounded-none md:border-l md:border-t-0",
          open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full",
          hideAtXl && "xl:hidden",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Len AI Assistant"
        aria-hidden={!open}
        inert={!open}
      >
        <AiAssistant
          question={question}
          context={context}
          onClose={() => setOpen(false)}
        />
      </div>
    </>
  );
}
