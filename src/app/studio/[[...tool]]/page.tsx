import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Database, ExternalLink } from "lucide-react";
import { StudioClient } from "../StudioClient";
import { isSanityConfigured, sanityConfig } from "@/lib/sanity";

export const metadata: Metadata = { title: "Sanity Studio" };
export const dynamic = "force-dynamic";

export default function StudioPage() {
  if (!isSanityConfigured) {
    return (
      <div className="container-page flex min-h-[70dvh] items-center justify-center py-12">
        <div className="card w-full max-w-lg p-7">
          <span className="grid h-11 w-11 place-items-center rounded-md border border-border bg-surface-2 text-fg">
            <Database className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Sanity Studio belum terhubung</h1>
          <p className="mt-2 text-[13px] leading-6 text-muted">
            Isi <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-primary">NEXT_PUBLIC_SANITY_PROJECT_ID</code>{" "}
            dan <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-primary">NEXT_PUBLIC_SANITY_DATASET</code>{" "}
            pada environment, lalu restart server. Selama belum terhubung, LeCode memakai data demo dan admin
            berjalan dalam mode demo.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-md border border-border bg-[#111110] p-3 font-mono text-[11px] leading-5 text-neutral-300">
{`# .env.local
NEXT_PUBLIC_SANITY_PROJECT_ID=xxxxxxxx
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=sk...`}
          </pre>
          <p className="mt-3 text-[11px] text-muted">
            Project ID saat ini: <span className="font-mono">{sanityConfig.projectId || "(kosong)"}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/lecodeadmin" className="btn-primary">
              <ArrowLeft className="h-4 w-4" /> Kembali ke admin
            </Link>
            <a
              href="https://www.sanity.io/manage"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
            >
              <ExternalLink className="h-4 w-4" /> Buat project Sanity
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <StudioClient />;
}
