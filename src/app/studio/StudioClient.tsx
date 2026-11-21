"use client";

import dynamic from "next/dynamic";
import config from "../../../sanity.config";

const NextStudio = dynamic(() => import("next-sanity/studio").then((mod) => mod.NextStudio), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-bg text-sm text-muted">Memuat LeCode Studio…</div>
  ),
});

export function StudioClient() {
  return (
    <div className="fixed inset-0 z-[90] h-dvh w-full overflow-hidden bg-white dark:bg-[#101112]">
      <NextStudio config={config} />
    </div>
  );
}
