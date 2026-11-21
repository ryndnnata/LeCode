import { getDemoStore } from "./demo-store";
import { isSanityConfigured, sanityClient } from "./sanity";
import { seedGames, seedLessons, seedQuestions, seedRoadmap } from "./seed";
import type {
  FeedbackItem,
  GameLevel,
  Lesson,
  Question,
  RoadmapNode,
  SiteStats,
} from "./types";
const lessonProjection = `{
  "_id": _id,
  title,
  "slug": slug.current,
  topic,
  level,
  order,
  summary,
  content,
  estimatedMinutes,
  "tags": coalesce(tags, [])
}`;

const questionProjection = `{
  "_id": _id,
  title,
  "slug": slug.current,
  type,
  difficulty,
  points,
  prompt,
  explanation,
  "hints": coalesce(hints, []),
  "options": coalesce(options[]{
    "id": coalesce(id, _key),
    text,
    isCorrect
  }, []),
  "codeConfig": codeConfig{
    language,
    functionName,
    starterCode,
    solution,
    web{
      html,
      css,
      js
    },
    "testCases": coalesce(testCases[]{
      args,
      expected,
      description,
      isHidden
    }, [])
  },
  "lessonSlug": lesson->slug.current,
  "isPublished": coalesce(isPublished, true)
}`;

const gameProjection = `{
  "_id": _id,
  title,
  "slug": slug.current,
  gameType,
  description,
  intro,
  config,
  "questionSlugs": coalesce(questions[]->slug.current, []),
  "isPlayable": coalesce(isPlayable, true)
}`;

const roadmapProjection = `{
  "_id": _id,
  title,
  "slug": slug.current,
  description,
  stage,
  order,
  "prerequisites": coalesce(prerequisites[]->slug.current, []),
  "skills": coalesce(skills, []),
  "resources": coalesce(resources, [])
}`;

async function fetchSanity<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!sanityClient) return null;
  try {
    return await sanityClient.fetch<T>(query, params);
  } catch (error) {
    console.error("[LeCode] Gagal mengambil data Sanity:", error);
    return null;
  }
}

export async function getLessons(): Promise<Lesson[]> {
  const data = await fetchSanity<Lesson[]>(`*[_type == "lesson"] | order(order asc) ${lessonProjection}`);
  return data && data.length > 0 ? data : seedLessons;
}

export async function getLessonBySlug(slug: string): Promise<Lesson | null> {
  const data = await fetchSanity<Lesson | null>(
    `*[_type == "lesson" && slug.current == $slug][0] ${lessonProjection}`,
    { slug },
  );
  if (data) return data;
  return seedLessons.find((lesson) => lesson.slug === slug) ?? null;
}

function demoQuestions(): Question[] {
  return getDemoStore().questions;
}

export async function getQuestions(): Promise<Question[]> {
  const data = await fetchSanity<Question[]>(
    `*[_type == "question" && isPublished != false] | order(difficulty asc, _createdAt asc) ${questionProjection}`,
  );
  return data && data.length > 0 ? data : demoQuestions();
}

export async function getQuestionsByLesson(lessonSlug: string): Promise<Question[]> {
  const data = await fetchSanity<Question[]>(
    `*[_type == "question" && isPublished != false && lesson->slug.current == $slug] | order(difficulty asc, _createdAt asc) ${questionProjection}`,
    { slug: lessonSlug },
  );
  if (data) return data;
  return demoQuestions().filter((question) => question.lessonSlug === lessonSlug);
}

export async function getAllQuestions(): Promise<Question[]> {
  if (isSanityConfigured) {
    const data = await fetchSanity<Question[]>(
      `*[_type == "question"] | order(_createdAt desc) ${questionProjection}`,
    );
    if (data) return data;
  }
  return demoQuestions();
}

export async function getQuestionBySlug(slug: string): Promise<Question | null> {
  const data = await fetchSanity<Question | null>(
    `*[_type == "question" && isPublished != false && slug.current == $slug][0] ${questionProjection}`,
    { slug },
  );
  if (data) return data;
  if (isSanityConfigured && data === null) {
  }
  return demoQuestions().find((question) => question.slug === slug) ?? null;
}

export async function getQuestionsBySlugs(slugs: string[]): Promise<Question[]> {
  if (slugs.length === 0) return [];
  const all = await getQuestions();
  const map = new Map(all.map((question) => [question.slug, question]));
  return slugs.map((slug) => map.get(slug)).filter((q): q is Question => Boolean(q));
}


export async function getGames(): Promise<GameLevel[]> {
  const data = await fetchSanity<GameLevel[]>(`*[_type == "gameLevel"] | order(_createdAt asc) ${gameProjection}`);
  return data && data.length > 0 ? data : seedGames;
}

export async function getGameBySlug(slug: string): Promise<GameLevel | null> {
  const data = await fetchSanity<GameLevel | null>(
    `*[_type == "gameLevel" && slug.current == $slug][0] ${gameProjection}`,
    { slug },
  );
  if (data) return data;
  return seedGames.find((game) => game.slug === slug) ?? null;
}

export async function getRoadmap(): Promise<RoadmapNode[]> {
  const data = await fetchSanity<RoadmapNode[]>(
    `*[_type == "roadmapNode"] | order(order asc) ${roadmapProjection}`,
  );
  return data && data.length > 0 ? data : seedRoadmap;
}

export async function getFeedback(): Promise<FeedbackItem[]> {
  const data = await fetchSanity<FeedbackItem[]>(
    `*[_type == "feedback"] | order(createdAt desc) {
      "_id": _id, name, email, category, message, pagePath, status, createdAt
    }`,
  );
  if (data) return data;
  return getDemoStore().feedback;
}

export async function getStats(): Promise<SiteStats> {
  const [lessons, questions, games, roadmap] = await Promise.all([
    getLessons(),
    getQuestions(),
    getGames(),
    getRoadmap(),
  ]);

  return {
    lessons: lessons.length,
    questions: questions.length,
    games: games.length,
    roadmapStages: new Set(roadmap.map((node) => node.stage)).size,
  };
}

export { isSanityConfigured };
