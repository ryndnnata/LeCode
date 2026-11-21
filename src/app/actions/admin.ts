"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminPassword, clearAdminCookie, isAdminAuthenticated, setAdminCookie } from "@/lib/auth";
import { getLessons } from "@/lib/content";
import { getDemoStore, newDemoId } from "@/lib/demo-store";
import { canWriteToSanity, sanityWriteClient } from "@/lib/sanity";
import type { CodeLanguage, FeedbackStatus, Level, QuestionType, WebFiles } from "@/lib/types";

export interface QuestionOptionInput {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionTestCaseInput {
  args: string;
  expected: string;
  description?: string;
  isHidden?: boolean;
}

export interface QuestionInput {
  _id?: string;
  title: string;
  slug: string;
  type: QuestionType;
  difficulty: Level;
  points: number;
  lessonSlug: string;
  prompt: string;
  explanation?: string;
  hints: string[];
  options: QuestionOptionInput[];
  codeConfig: {
    language?: CodeLanguage;
    functionName: string;
    starterCode: string;
    solution?: string;
    testCases: QuestionTestCaseInput[];
    web?: WebFiles;
  } | null;
  isPublished: boolean;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

function isJson(value: string) {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}

function validate(input: QuestionInput): string | null {
  if (!input.title.trim()) return "Judul soal wajib diisi.";
  if (!/^[a-z0-9-]{3,80}$/.test(input.slug)) return "Slug hanya boleh huruf kecil, angka, dan tanda hubung.";
  if (!input.prompt.trim()) return "Instruksi soal wajib diisi.";
  if (!input.lessonSlug) return "Pilih materi untuk soal ini.";

  if (input.type === "mcq") {
    const filled = input.options.filter((option) => option.text.trim());
    if (filled.length < 2) return "Isi minimal dua pilihan jawaban.";
    if (filled.filter((option) => option.isCorrect).length !== 1) return "Tandai tepat satu jawaban benar.";
  } else {
    const config = input.codeConfig;
    const language: CodeLanguage = config?.language === "web" ? "web" : "python";

    if (language === "web") {
      const files = config?.web ?? { html: config?.starterCode ?? "", css: "", js: "" };
      if (!files.html.trim() && !files.js.trim()) {
        return "Isi berkas HTML atau JavaScript untuk tantangan web.";
      }
      const checks = (config?.testCases ?? []).filter((test) => test.args.trim() && test.expected.trim());
      if (checks.length === 0) return "Tambahkan minimal satu pemeriksaan untuk tantangan web.";
      for (const check of checks) {
        if (!check.args.trim()) return "Ekspresi pemeriksaan wajib diisi.";
        if (!isJson(check.expected)) return `Nilai yang diharapkan bukan JSON valid: ${check.expected}`;
      }
      return null;
    }

    if (!config?.functionName.trim()) return "Nama fungsi wajib diisi untuk soal kode.";
    if (!config.starterCode.trim()) return "Starter code wajib diisi.";
    const tests = config.testCases.filter((test) => test.args.trim() && test.expected.trim());
    if (tests.length === 0) return "Tambahkan minimal satu test case.";
    for (const test of tests) {
      if (!isJson(test.args)) return `Argumen test bukan JSON valid: ${test.args}`;
      if (!isJson(test.expected)) return `Expected test bukan JSON valid: ${test.expected}`;
    }
  }

  return null;
}

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { ok: false, error: "Masukkan password admin." };
  if (password !== adminPassword()) return { ok: false, error: "Password salah. Coba lagi." };
  await setAdminCookie();
  redirect("/lecodeadmin");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/lecodeadmin/login");
}

function revalidateQuestion(lessonSlug: string) {
  revalidatePath("/belajar");
  revalidatePath("/lecodeadmin");
  revalidatePath(`/belajar/${lessonSlug}`);
  revalidatePath("/game", "layout");
}

async function previousLessonSlugFor(id: string): Promise<string | null> {
  if (canWriteToSanity && sanityWriteClient && !id.startsWith("q-")) {
    try {
      return await sanityWriteClient.fetch<string | null>(
        `*[_type == "question" && _id == $id][0].lesson->slug.current`,
        { id },
      );
    } catch (error) {
      console.error("[LeCode] Gagal membaca materi lama soal:", error);
      return null;
    }
  }
  return getDemoStore().questions.find((question) => question._id === id)?.lessonSlug ?? null;
}

async function lessonSlugExists(slug: string, cache: Map<string, boolean>): Promise<boolean> {
  const cached = cache.get(slug);
  if (cached !== undefined) return cached;
  const lessons = await getLessons();
  const exists = lessons.some((lesson) => lesson.slug === slug);
  cache.set(slug, exists);
  return exists;
}

function buildCodeConfig(
  input: QuestionInput,
  tests: { _key?: string; args: string; expected: string; description?: string; isHidden: boolean }[],
) {
  if (input.type !== "code" || !input.codeConfig) return null;

  const language: CodeLanguage = input.codeConfig.language === "web" ? "web" : "python";
  const web = input.codeConfig.web;

  if (language === "web") {
    const html = web?.html ?? input.codeConfig.starterCode;
    return {
      language,
      functionName: input.codeConfig.functionName.trim() || "web",
      starterCode: html,
      solution: input.codeConfig.solution ?? "",
      testCases: tests,
      web: { html, css: web?.css ?? "", js: web?.js ?? "" },
    };
  }

  return {
    language,
    functionName: input.codeConfig.functionName.trim(),
    starterCode: input.codeConfig.starterCode,
    solution: input.codeConfig.solution ?? "",
    testCases: tests,
  };
}

async function persistQuestion(
  input: QuestionInput,
  lessonCache?: Map<string, string | null>,
  lessonExistsCache?: Map<string, boolean>,
): Promise<ActionResult> {
  const validationError = validate(input);
  if (validationError) return { ok: false, error: validationError };

  const cleanOptions = input.options
    .filter((option) => option.text.trim())
    .map((option, index) => ({
      _key: option.id || `opt-${index}`,
      id: option.id || String.fromCharCode(97 + index),
      text: option.text.trim(),
      isCorrect: Boolean(option.isCorrect),
    }));

  const cleanTests = (input.codeConfig?.testCases ?? [])
    .filter((test) => test.args.trim() && test.expected.trim())
    .map((test, index) => ({
      _key: `tc-${index}`,
      args: test.args.trim(),
      expected: test.expected.trim(),
      description: test.description?.trim() || undefined,
      isHidden: Boolean(test.isHidden),
    }));

  if (canWriteToSanity && sanityWriteClient) {
    try {
      let lessonId = lessonCache?.get(input.lessonSlug);
      if (lessonId === undefined) {
        lessonId = await sanityWriteClient.fetch<string | null>(
          `*[_type == "lesson" && slug.current == $slug][0]._id`,
          { slug: input.lessonSlug },
        );
        lessonCache?.set(input.lessonSlug, lessonId);
      }
      if (!lessonId) {
        return {
          ok: false,
          error: `Materi dengan slug "${input.lessonSlug}" tidak ditemukan di Sanity. Buat dokumen lesson dulu.`,
        };
      }

      const doc = {
        _type: "question",
        title: input.title.trim(),
        slug: { _type: "slug", current: input.slug.trim() },
        type: input.type,
        difficulty: input.difficulty,
        points: Number(input.points) || 10,
        prompt: input.prompt,
        explanation: input.explanation ?? "",
        hints: input.hints.filter(Boolean),
        options: input.type === "mcq" ? cleanOptions : [],
        codeConfig: buildCodeConfig(input, cleanTests),
        lesson: { _type: "reference", _ref: lessonId },
        isPublished: input.isPublished,
      };

      if (input._id && !input._id.startsWith("q-")) {
        await sanityWriteClient.patch(input._id).set(doc).commit();
      } else {
        await sanityWriteClient.create(doc);
      }

      return { ok: true, message: "Soal tersimpan di Sanity." };
    } catch (error) {
      console.error("[LeCode] Gagal menyimpan soal:", error);
      return { ok: false, error: "Sanity menolak penyimpanan. Periksa token dan koneksi." };
    }
  }


  if (!(await lessonSlugExists(input.lessonSlug, lessonExistsCache ?? new Map()))) {
    return {
      ok: false,
      error: `Materi dengan slug "${input.lessonSlug}" tidak ditemukan. Pilih materi yang tersedia.`,
    };
  }

  const store = getDemoStore();
  const existingIndex = store.questions.findIndex((question) => question._id === input._id);

  const question = {
    _id: input._id ?? newDemoId("q"),
    title: input.title.trim(),
    slug: input.slug.trim(),
    type: input.type,
    difficulty: input.difficulty,
    points: Number(input.points) || 10,
    prompt: input.prompt,
    explanation: input.explanation ?? "",
    hints: input.hints.filter(Boolean),
    options: input.type === "mcq" ? cleanOptions.map(({ _key, ...rest }) => rest) : undefined,
    codeConfig: buildCodeConfig(
      input,
      cleanTests.map(({ _key, ...rest }) => rest),
    ) ?? undefined,
    lessonSlug: input.lessonSlug,
    isPublished: input.isPublished,
  };

  if (existingIndex >= 0) store.questions[existingIndex] = question;
  else store.questions.unshift(question);

  return { ok: true, message: "Soal tersimpan (mode demo)." };
}

export async function saveQuestionAction(input: QuestionInput): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Sesi admin berakhir. Login ulang." };

  const previousLesson = input._id ? await previousLessonSlugFor(input._id) : null;
  const result = await persistQuestion(input);
  if (result.ok) {
    revalidateQuestion(input.lessonSlug);
    if (previousLesson && previousLesson !== input.lessonSlug) {
      revalidatePath(`/belajar/${previousLesson}`);
    }
  }
  return result;
}

export interface ImportQuestionsResult extends ActionResult {
  imported: number;
  skipped: number;
  renamed: number;
  issues: { title: string; error: string }[];
}


export async function importQuestionsAction(inputs: QuestionInput[]): Promise<ImportQuestionsResult> {
  const empty: ImportQuestionsResult = { ok: false, imported: 0, skipped: 0, renamed: 0, issues: [] };

  if (!(await isAdminAuthenticated())) return { ...empty, error: "Sesi admin berakhir. Login ulang." };
  if (!Array.isArray(inputs) || inputs.length === 0) return { ...empty, error: "Tidak ada soal untuk diimpor." };
  if (inputs.length > 500) return { ...empty, error: "Maksimal 500 soal per sekali impor." };


  const usedSlugs = new Set<string>();
  if (canWriteToSanity && sanityWriteClient) {
    try {
      const slugs = await sanityWriteClient.fetch<string[]>(`*[_type == "question"].slug.current`);
      for (const slug of slugs) if (slug) usedSlugs.add(slug);
    } catch (error) {
      console.error("[LeCode] Gagal memuat slug soal:", error);
      return { ...empty, error: "Gagal membaca daftar soal dari Sanity. Coba lagi." };
    }
  } else {
    for (const question of getDemoStore().questions) usedSlugs.add(question.slug);
  }

  const uniqueSlug = (slug: string) => {
    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug);
      return { slug, renamed: false };
    }

    const base = slug.slice(0, 75).replace(/-+$/, "");
    let counter = 2;
    while (usedSlugs.has(`${base}-${counter}`)) counter += 1;
    const next = `${base}-${counter}`;
    usedSlugs.add(next);
    return { slug: next, renamed: true };
  };

  const lessonCache = new Map<string, string | null>();
  const lessonExistsCache = new Map<string, boolean>();
  let imported = 0;
  let skipped = 0;
  let renamed = 0;
  const issues: { title: string; error: string }[] = [];

  for (const input of inputs) {
    const slugged = uniqueSlug(input.slug);
    const result = await persistQuestion({ ...input, slug: slugged.slug }, lessonCache, lessonExistsCache);
    if (result.ok) {
      imported += 1;
      if (slugged.renamed) renamed += 1;
    } else {
      skipped += 1;
      issues.push({ title: input.title || "(tanpa judul)", error: result.error ?? "Gagal disimpan." });
    }
  }

  if (imported > 0) {
    const slugs = new Set(inputs.map((input) => input.lessonSlug));
    revalidatePath("/belajar");
    revalidatePath("/lecodeadmin");
    revalidatePath("/game", "layout");
    for (const slug of slugs) revalidatePath(`/belajar/${slug}`);
  }

  const parts = [`${imported} soal diimpor`];
  if (skipped > 0) parts.push(`${skipped} dilewati`);
  if (renamed > 0) parts.push(`${renamed} slug disesuaikan`);
  return {
    ok: imported > 0,
    imported,
    skipped,
    renamed,
    issues,
    message: `${parts.join(", ")}${canWriteToSanity && sanityWriteClient ? " ke Sanity." : " (mode demo)."}`,
    error: imported === 0 ? "Tidak ada soal yang berhasil diimpor." : undefined,
  };
}

export async function deleteQuestionAction(id: string): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Sesi admin berakhir." };

  if (canWriteToSanity && sanityWriteClient && !id.startsWith("q-")) {
    try {
      await sanityWriteClient.delete(id);
      revalidatePath("/belajar");
      revalidatePath("/lecodeadmin");
      revalidatePath("/game", "layout");
      return { ok: true, message: "Soal dihapus dari Sanity." };
    } catch (error) {
      console.error("[LeCode] Gagal menghapus soal:", error);
      return { ok: false, error: "Gagal menghapus soal di Sanity." };
    }
  }

  const store = getDemoStore();
  store.questions = store.questions.filter((question) => question._id !== id);
  revalidatePath("/belajar");
  revalidatePath("/lecodeadmin");
  revalidatePath("/game", "layout");
  return { ok: true, message: "Soal dihapus (mode demo)." };
}

export async function updateFeedbackStatusAction(id: string, status: FeedbackStatus): Promise<ActionResult> {
  if (!(await isAdminAuthenticated())) return { ok: false, error: "Sesi admin berakhir." };

  if (canWriteToSanity && sanityWriteClient && !id.startsWith("fb-")) {
    try {
      await sanityWriteClient.patch(id).set({ status }).commit();
      revalidatePath("/lecodeadmin");
      return { ok: true };
    } catch (error) {
      console.error("[LeCode] Gagal memperbarui feedback:", error);
      return { ok: false, error: "Gagal memperbarui status di Sanity." };
    }
  }

  const store = getDemoStore();
  const item = store.feedback.find((feedback) => feedback._id === id);
  if (item) item.status = status;
  revalidatePath("/lecodeadmin");
  return { ok: true };
}
