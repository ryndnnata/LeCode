import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Mascot } from "@/components/brand/Mascot";
import { LoginForm } from "@/components/admin/LoginForm";
import { isAdminAuthenticated } from "@/lib/auth";

export const metadata: Metadata = { title: "Login Admin" };

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/lecodeadmin");

  return (
    <div className="container-page flex min-h-[calc(100dvh-3.5rem)] items-center justify-center py-10">
      <div className="card w-full max-w-md overflow-hidden">
        <div className="border-b border-border px-6 pb-5 pt-7 text-center">
          <Mascot className="mx-auto w-24" />
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> Area admin
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">Masuk ke LeCode CMS</h1>
          <p className="mt-1 text-[12.5px] leading-5 text-muted">
            Kelola bank soal, tinjau feedback, dan atur konten.
          </p>
        </div>
        <div className="px-6 pb-6">
          <LoginForm />
          <Link
            href="/"
            className="mt-5 flex items-center justify-center gap-1.5 text-[11.5px] text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3 w-3" /> Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
