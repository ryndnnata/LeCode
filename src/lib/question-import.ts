import type { QuestionInput, QuestionOptionInput, QuestionTestCaseInput } from "@/app/actions/admin";
import type { Level, QuestionType } from "./types";

/**
 * Spesifikasi kolom template impor soal (Excel/CSV).
 * Header ditulis apa adanya di baris pertama file.
 */
export const IMPORT_HEADERS = [
  "tipe",
  "judul",
  "slug",
  "materi_slug",
  "level",
  "poin",
  "instruksi",
  "penjelasan",
  "hint",
  "pilihan_a",
  "pilihan_b",
  "pilihan_c",
  "pilihan_d",
  "pilihan_e",
  "jawaban_benar",
  "fungsi",
  "starter_code",
  "solusi",
  "test_cases",
  "publikasi",
] as const;

export const OPTION_KEYS = ["pilihan_a", "pilihan_b", "pilihan_c", "pilihan_d", "pilihan_e"] as const;

export interface ParsedImportRow {
  row: number;
  title: string;
  type: QuestionType;
  input: QuestionInput;
  errors: string[];
  warnings: string[];
}

export interface ParseImportResult {
  rows: ParsedImportRow[];
  fatal?: string;
}

const LEVEL_ALIASES: Record<string, Level> = {
  pemula: "pemula",
  dasar: "pemula",
  beginner: "pemula",
  mudah: "pemula",
  menengah: "menengah",
  intermediate: "menengah",
  lanjutan: "menengah",
  sedang: "menengah",
  mahir: "mahir",
  advanced: "mahir",
  expert: "mahir",
  sulit: "mahir",
};

const TYPE_ALIASES: Record<string, QuestionType> = {
  mcq: "mcq",
  kuis: "mcq",
  quiz: "mcq",
  "pilihan ganda": "mcq",
  pg: "mcq",
  code: "code",
  kode: "code",
  coding: "code",
  "tantangan kode": "code",
};

export function slugifyTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

function normalizeKey(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function cellBool(value: unknown, fallback: boolean) {
  const text = cellText(value).toLowerCase();
  if (!text) return fallback;
  if (["ya", "yes", "y", "true", "1", "publikasi", "publish", "aktif"].includes(text)) return true;
  if (["tidak", "no", "n", "false", "0", "draft", "nonaktif", "belum"].includes(text)) return false;
  return fallback;
}


function toArgsJson(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]);
  } catch {
    // "2, 3" -> [2, 3]
    try {
      const parsed: unknown = JSON.parse(`[${text}]`);
      return JSON.stringify(parsed);
    } catch {
      return JSON.stringify([text]);
    }
  }
}


function toValueJson(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  try {
    JSON.parse(text);
    return text;
  } catch {
    return JSON.stringify(text);
  }
}

function parseTestCases(raw: string): { tests: QuestionTestCaseInput[]; errors: string[] } {
  const tests: QuestionTestCaseInput[] = [];
  const errors: string[] = [];

  for (const rawLine of raw.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("{")) {
      try {
        const parsed = JSON.parse(line) as {
          args?: unknown;
          expected?: unknown;
          description?: string;
          hidden?: boolean;
          isHidden?: boolean;
        };
        if (parsed.args === undefined || parsed.expected === undefined) {
          errors.push(`Test "${line}" harus punya "args" dan "expected".`);
          continue;
        }
        tests.push({
          args: JSON.stringify(parsed.args),
          expected: JSON.stringify(parsed.expected),
          description: parsed.description?.trim() || undefined,
          isHidden: Boolean(parsed.hidden ?? parsed.isHidden),
        });
      } catch {
        errors.push(`Test "${line}" bukan JSON yang valid.`);
      }
      continue;
    }

    let isHidden = false;
    const hiddenMatch = line.match(/\|\s*(hidden|sembunyi|tersembunyi)\s*$/i);
    if (hiddenMatch) {
      isHidden = true;
      line = line.slice(0, hiddenMatch.index).trim();
    }

    const separator = line.includes("=>") ? "=>" : line.includes("->") ? "->" : null;
    if (!separator) {
      errors.push(`Test "${line}" harus berformat: [argumen] => hasil.`);
      continue;
    }
    const [left, ...rest] = line.split(separator);
    const right = rest.join(separator);
    const args = toArgsJson(left);
    const expected = toValueJson(right);
    if (!args || !expected) {
      errors.push(`Test "${line}" tidak lengkap. Gunakan format: [argumen] => hasil.`);
      continue;
    }
    tests.push({ args, expected, isHidden });
  }

  return { tests, errors };
}

function splitHints(raw: string) {
  return raw
    .split(/[|\n]/)
    .map((hint) => hint.trim())
    .filter(Boolean);
}


export function parseImportRows(
  rawRows: Record<string, unknown>[],
  lessons: { slug: string; title: string }[],
): ParseImportResult {
  const rows: ParsedImportRow[] = [];

  const hasHeader = rawRows.some((row) =>
    Object.keys(row).some((key) => normalizeKey(key) === "judul"),
  );
  if (rawRows.length > 0 && !hasHeader) {
    return {
      rows,
      fatal:
        "Header tidak dikenali. Pastikan baris pertama berisi kolom template (minimal \"judul\" dan \"instruksi\"). Unduh template untuk memulai.",
    };
  }

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2;
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) data[normalizeKey(key)] = value;

    const isEmpty = Object.values(data).every((value) => !cellText(value));
    if (isEmpty) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    const title = cellText(data.judul);
    if (!title) errors.push("Kolom \"judul\" wajib diisi.");

    const prompt = cellText(data.instruksi);
    if (!prompt) errors.push("Kolom \"instruksi\" wajib diisi.");


    const rawType = cellText(data.tipe).toLowerCase();
    let type: QuestionType;
    if (rawType) {
      const mapped = TYPE_ALIASES[rawType];
      if (!mapped) {
        errors.push(`Tipe "${rawType}" tidak dikenal. Gunakan "mcq" atau "kode".`);
        type = "mcq";
      } else {
        type = mapped;
      }
    } else {
      type = cellText(data.fungsi) || cellText(data.starter_code) ? "code" : "mcq";
    }

  
    const rawLevel = cellText(data.level).toLowerCase();
    let difficulty: Level = "pemula";
    if (rawLevel) {
      const mapped = LEVEL_ALIASES[rawLevel];
      if (!mapped) {
        warnings.push(`Level "${rawLevel}" tidak dikenal, memakai "pemula".`);
      } else {
        difficulty = mapped;
      }
    }

    
    const rawLesson = cellText(data.materi_slug) || cellText(data.materi);
    let lessonSlug = "";
    if (!rawLesson) {
      errors.push("Kolom \"materi_slug\" wajib diisi.");
    } else {
      const bySlug = lessons.find((lesson) => lesson.slug.toLowerCase() === rawLesson.toLowerCase());
      const byTitle = bySlug
        ? undefined
        : lessons.find((lesson) => lesson.title.toLowerCase() === rawLesson.toLowerCase());
      const match = bySlug ?? byTitle;
      if (!match) {
        errors.push(
          `Materi "${rawLesson}" tidak ditemukan. Pilih salah satu slug dari sheet Petunjuk.`,
        );
      } else {
        lessonSlug = match.slug;
      }
    }

  
    const rawSlug = cellText(data.slug);
    let slug = slugifyTitle(rawSlug || title);
    if (rawSlug && slug !== rawSlug) {
      warnings.push(`Slug "${rawSlug}" dirapikan menjadi "${slug}".`);
    }
    if (!slug) {
      errors.push("Slug tidak valid. Isi \"slug\" atau perbaiki \"judul\".");
      slug = `soal-${rowNumber}`;
    } else if (slug.length < 3) {
      errors.push("Slug minimal 3 karakter. Perpanjang judul atau isi kolom \"slug\".");
    }

    const points = Number.parseInt(cellText(data.poin), 10);

  
    const options: QuestionOptionInput[] = [];
    if (type === "mcq") {
      OPTION_KEYS.forEach((key, optionIndex) => {
        const text = cellText(data[key]);
        if (text) {
          options.push({ id: String.fromCharCode(97 + optionIndex), text, isCorrect: false });
        }
      });

      const rawAnswer = cellText(data.jawaban_benar);
      if (options.length < 2) {
        errors.push("Soal pilihan ganda butuh minimal dua pilihan (pilihan_a, pilihan_b, …).");
      } else if (!rawAnswer) {
        errors.push("Isi kolom \"jawaban_benar\" dengan huruf pilihan (a/b/c/…) atau teks jawaban.");
      } else {
        const normalizedAnswer = rawAnswer.toLowerCase();
        let target: QuestionOptionInput | undefined;
        if (/^[a-e]$/.test(normalizedAnswer)) {
          target = options.find((option) => option.id === normalizedAnswer);
        } else if (/^[1-5]$/.test(normalizedAnswer)) {
          target = options[Number(normalizedAnswer) - 1];
        } else {
          target = options.find((option) => option.text.toLowerCase() === normalizedAnswer);
        }
        if (!target) {
          errors.push(`Jawaban benar "${rawAnswer}" tidak cocok dengan pilihan yang diisi.`);
        } else {
          target.isCorrect = true;
        }
      }
    }


    let codeConfig: QuestionInput["codeConfig"] = null;
    if (type === "code") {
      const functionName = cellText(data.fungsi);
      const starterCode = cellText(data.starter_code);
      if (!functionName) errors.push("Soal kode butuh kolom \"fungsi\" (nama fungsi Python).");
      if (!starterCode) errors.push("Soal kode butuh kolom \"starter_code\".");
      const { tests, errors: testErrors } = parseTestCases(cellText(data.test_cases));
      errors.push(...testErrors);
      if (tests.length === 0) errors.push("Soal kode butuh minimal satu test case di kolom \"test_cases\".");
      codeConfig = {
        functionName,
        starterCode,
        solution: cellText(data.solusi) || undefined,
        testCases: tests,
      };
    }

    rows.push({
      row: rowNumber,
      title: title || `(baris ${rowNumber})`,
      type,
      errors,
      warnings,
      input: {
        title,
        slug,
        type,
        difficulty,
        points: Number.isFinite(points) && points > 0 ? points : 10,
        lessonSlug,
        prompt,
        explanation: cellText(data.penjelasan),
        hints: splitHints(cellText(data.hint)),
        options,
        codeConfig,
        isPublished: cellBool(data.publikasi, true),
      },
    });
  });

  return { rows };
}


export function buildTemplateRows(lessons: { slug: string; title: string }[]) {
  const defaultLesson = lessons[0]?.slug ?? "python-dasar";

  const mcqExample: (string | number)[] = [
    "mcq",
    "Contoh: hasil penjumlahan",
    "",
    defaultLesson,
    "pemula",
    10,
    "Berapa hasil dari 2 + 3?",
    "Penjumlahan dua bilangan bulat.",
    "Hitung dengan jari|Gunakan kalkulator",
    "4",
    "5",
    "6",
    "",
    "",
    "b",
    "",
    "",
    "",
    "",
    "ya",
  ];

  const codeExample: (string | number)[] = [
    "kode",
    "Contoh: fungsi penjumlahan",
    "",
    defaultLesson,
    "pemula",
    20,
    "Lengkapi fungsi jumlah(a, b) agar mengembalikan hasil penjumlahan a dan b.",
    "Gunakan operator +.",
    "Kembalikan nilainya dengan return",
    "",
    "",
    "",
    "",
    "",
    "",
    "jumlah",
    "def jumlah(a, b):\n    # tulis kode di sini\n    pass",
    "def jumlah(a, b):\n    return a + b",
    "[2, 3] => 5\n[-1, 1] => 0\n[0, 0] => 0 | hidden",
    "ya",
  ];

  return [IMPORT_HEADERS.slice(), mcqExample, codeExample];
}


export function buildGuideRows(lessons: { slug: string; title: string }[]) {
  const rows: (string | number)[][] = [
    ["PETUNJUK IMPOR SOAL LECODE"],
    [""],
    ["1. Isi sheet \"Soal\". Satu baris = satu soal. Jangan ubah nama kolom di baris pertama."],
    ["2. Kolom wajib: judul, materi_slug, instruksi."],
    ["3. Untuk soal kuis: isi pilihan_a … pilihan_e, lalu jawaban_benar (huruf a/b/c/d/e atau teks jawaban)."],
    ["4. Untuk soal kode: isi fungsi, starter_code, dan test_cases. Satu test per baris (Alt+Enter di Excel)."],
    ["   Format test: [argumen] => hasil. Contoh: [2, 3] => 5"],
    ["   Tambahkan | hidden di akhir baris untuk menyembunyikan test dari siswa."],
    ["   Argumen berupa beberapa nilai: [\"halo\", 2] => \"halo2\""],
    ["5. hint: pisahkan beberapa hint dengan tanda | (pipe)."],
    ["6. publikasi: ya / tidak. Kosong berarti ya."],
    ["7. Baris contoh boleh dihapus sebelum diunggah."],
    [""],
    ["NILAI YANG DITERIMA"],
    ["tipe", "mcq / kode"],
    ["level", "pemula / menengah / mahir"],
    ["publikasi", "ya / tidak"],
    [""],
    ["DAFTAR MATERI (materi_slug)"],
    ["slug", "judul"],
  ];

  for (const lesson of lessons) rows.push([lesson.slug, lesson.title]);

  return rows;
}
