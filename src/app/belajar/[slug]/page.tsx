import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonWorkspace } from "@/components/learn/LessonWorkspace";
import { getLessonBySlug, getLessons, getQuestionsByLesson } from "@/lib/content";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ soal?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) return { title: "Materi tidak ditemukan" };
  return {
    title: lesson.title,
    description: lesson.summary,
  };
}

export default async function LessonPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { soal } = await searchParams;

  const lesson = await getLessonBySlug(slug);
  if (!lesson) notFound();

  const questions = await getQuestionsByLesson(slug);

  return <LessonWorkspace lesson={lesson} questions={questions} initialSlug={soal} />;
}
