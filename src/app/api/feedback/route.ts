import { getDemoStore, newDemoId } from "@/lib/demo-store";
import { canWriteToSanity, sanityWriteClient } from "@/lib/sanity";
import type { FeedbackCategory } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface FeedbackRequest {
  name?: string;
  email?: string;
  category?: FeedbackCategory;
  message?: string;
  pagePath?: string;
}

export async function POST(request: Request) {
  let body: FeedbackRequest;
  try {
    body = (await request.json()) as FeedbackRequest;
  } catch {
    return Response.json({ ok: false, error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const category: FeedbackCategory = body.category === "saran" ? "saran" : "laporan";
  const name = (body.name ?? "").trim() || "Anonim";
  const email = (body.email ?? "").trim();

  if (message.length < 8) {
    return Response.json(
      { ok: false, error: "Tulis minimal 8 karakter agar kami paham masalahnya." },
      { status: 422 },
    );
  }

  if (message.length > 4000) {
    return Response.json({ ok: false, error: "Pesan terlalu panjang (maks 4000 karakter)." }, { status: 422 });
  }

  const payload = {
    name,
    email,
    category,
    message,
    pagePath: (body.pagePath ?? "/lapor").slice(0, 300),
    status: "baru" as const,
    createdAt: new Date().toISOString(),
  };

  if (canWriteToSanity && sanityWriteClient) {
    try {
      const created = await sanityWriteClient.create({
        _type: "feedback",
        ...payload,
      });
      return Response.json({ ok: true, id: created._id, mode: "sanity" });
    } catch (error) {
      console.error("[LeCode] Gagal menyimpan feedback ke Sanity:", error);
      return Response.json(
        { ok: false, error: "Gagal menyimpan ke CMS. Coba lagi atau hubungi admin." },
        { status: 500 },
      );
    }
  }


  const store = getDemoStore();
  const id = newDemoId("fb");
  store.feedback.unshift({ _id: id, ...payload });

  return Response.json({ ok: true, id, mode: "demo" });
}
