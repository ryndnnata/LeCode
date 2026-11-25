import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BossBattle } from "@/components/game/BossBattle";
import { getGameBySlug, getQuestions } from "@/lib/content";

export const revalidate = 60;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game tidak ditemukan" };
  return { title: `${game.title} — Arena`, description: game.description };
}


export default async function GameArenaPage({ params }: PageProps) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();
  if (game.gameType !== "boss") redirect(`/game/${game.slug}`);

  const questions = await getQuestions();

  return <BossBattle game={game} questions={questions} fullscreen />;
}
