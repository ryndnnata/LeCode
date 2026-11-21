import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { describeAiProvider } from "@/lib/ai-provider";
import { isAdminAuthenticated } from "@/lib/auth";
import { getAllQuestions, getFeedback, getLessons } from "@/lib/content";
import { canWriteToSanity, isSanityConfigured } from "@/lib/sanity";

export const metadata: Metadata = { title: "Admin & CMS" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/lecodeadmin/login");

  const [questions, lessons, feedback] = await Promise.all([
    getAllQuestions(),
    getLessons(),
    getFeedback(),
  ]);

  return (
    <AdminDashboard
      questions={questions}
      lessons={lessons.map((lesson) => ({ slug: lesson.slug, title: lesson.title }))}
      feedback={feedback}
      mode={{ sanity: isSanityConfigured, writable: canWriteToSanity }}
      ai={describeAiProvider()}
    />
  );
}
