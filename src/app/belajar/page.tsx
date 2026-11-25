import type { Metadata } from "next";
import { LearnBrowser } from "@/components/learn/LearnBrowser";
import { getLessons, getQuestions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Belajar",
  description:
    "Kumpulan materi dan tes LeCode: kuis pilihan ganda sampai tantangan menulis kode Python dengan terminal di browser.",
};

export const revalidate = 120;

export default async function BelajarPage() {
  const lessons = await getLessons();
  const questions = await getQuestions();

  return (
    <div className="container-page py-10 sm:py-12">
      <LearnBrowser lessons={lessons} questions={questions} />
    </div>
  );
}
