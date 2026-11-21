"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, X } from "lucide-react";
import type { Level, Question, QuestionType } from "@/lib/types";
import type { QuestionInput } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

const emptyOption = (index: number) => ({
  id: String.fromCharCode(97 + index),
  text: "",
  isCorrect: index === 0,
});

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export function draftFromQuestion(question: Question | null, defaultLesson: string): QuestionInput {
  if (!question) {
    return {
      title: "",
      slug: "",
      type: "mcq",
      difficulty: "pemula",
      points: 10,
      lessonSlug: defaultLesson,
      prompt: "",
      explanation: "",
      hints: [],
      options: [emptyOption(0), emptyOption(1), emptyOption(2), emptyOption(3)],
      codeConfig: {
        language: "python",
        functionName: "solve",
        starterCode: "def solve(data):\n    # tulis jawabanmu di sini\n    pass\n",
        solution: "",
        testCases: [{ args: "[]", expected: "0", description: "contoh" }],
        web: { html: "<h1>Halo, LeCode!</h1>\n", css: "", js: "" },
      },
      isPublished: true,
    };
  }

  return {
    _id: question._id,
    title: question.title,
    slug: question.slug,
    type: question.type,
    difficulty: question.difficulty,
    points: question.points,
    lessonSlug: question.lessonSlug,
    prompt: question.prompt,
    explanation: question.explanation ?? "",
    hints: question.hints ?? [],
    options:
      question.options && question.options.length > 0
        ? question.options
        : [emptyOption(0), emptyOption(1), emptyOption(2), emptyOption(3)],
    codeConfig: question.codeConfig
      ? {
          language: question.codeConfig.language,
          functionName: question.codeConfig.functionName,
          starterCode: question.codeConfig.starterCode,
          solution: question.codeConfig.solution ?? "",
          testCases: question.codeConfig.testCases.map((test) => ({
            args: test.args,
            expected: test.expected,
            description: test.description ?? "",
            isHidden: test.isHidden,
          })),
          web: question.codeConfig.web ?? {
            html: question.codeConfig.starterCode,
            css: "",
            js: "",
          },
        }
      : {
          language: "python",
          functionName: "solve",
          starterCode: "def solve(data):\n    pass\n",
          solution: "",
          testCases: [{ args: "[]", expected: "0", description: "" }],
          web: { html: "<h1>Halo, LeCode!</h1>\n", css: "", js: "" },
        },
    isPublished: question.isPublished !== false,
  };
}

export function QuestionEditor({
  question,
  lessons,
  onClose,
  onSave,
}: {
  question: Question | null;
  lessons: { slug: string; title: string }[];
  onClose: () => void;
  onSave: (input: QuestionInput) => Promise<{ ok: boolean; error?: string; message?: string }>;
}) {
  const [draft, setDraft] = useState<QuestionInput>(() =>
    draftFromQuestion(question, lessons[0]?.slug ?? ""),
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(question));
  const [hintsText, setHintsText] = useState((question?.hints ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const patch = (values: Partial<QuestionInput>) => setDraft((current) => ({ ...current, ...values }));
  const isWeb = draft.codeConfig?.language === "web";

  const addOption = () => {
    setDraft((current) => ({
      ...current,
      options: [...current.options, emptyOption(current.options.length)],
    }));
  };

  const updateOption = (index: number, values: Partial<QuestionInput["options"][number]>) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...values } : option,
      ),
    }));
  };

  const addTestCase = () => {
    setDraft((current) => ({
      ...current,
      codeConfig: current.codeConfig
        ? {
            ...current.codeConfig,
            testCases: [...current.codeConfig.testCases, { args: "[]", expected: "", description: "" }],
          }
        : current.codeConfig,
    }));
  };

  const setLanguage = (language: "python" | "web") => {
    setDraft((current) => {
      if (!current.codeConfig) return current;
      return {
        ...current,
        codeConfig: {
          ...current.codeConfig,
          language,
          web:
            language === "web"
              ? current.codeConfig.web ?? {
                  html: current.codeConfig.starterCode,
                  css: "",
                  js: "",
                }
              : current.codeConfig.web,
        },
      };
    });
  };

  const updateWeb = (key: "html" | "css" | "js", value: string) => {
    setDraft((current) => {
      if (!current.codeConfig) return current;
      const web = current.codeConfig.web ?? { html: "", css: "", js: "" };
      return {
        ...current,
        codeConfig: {
          ...current.codeConfig,
          web: { ...web, [key]: value },
        },
      };
    });
  };

  const updateTestCase = (
    index: number,
    values: Partial<NonNullable<QuestionInput["codeConfig"]>["testCases"][number]>,
  ) => {
    setDraft((current) => {
      if (!current.codeConfig) return current;
      return {
        ...current,
        codeConfig: {
          ...current.codeConfig,
          testCases: current.codeConfig.testCases.map((test, testIndex) =>
            testIndex === index ? { ...test, ...values } : test,
          ),
        },
      };
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const payload: QuestionInput = {
      ...draft,
      hints: hintsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      codeConfig: draft.type === "code" ? draft.codeConfig : null,
    };
    const result = await onSave(payload);
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Gagal menyimpan soal.");
      return;
    }
    onClose();
  };

  const title = question ? "Ubah soal" : "Tambah soal baru";

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/50">
      <div className="h-full w-full max-w-3xl overflow-y-auto border-l border-border bg-bg-soft">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-bg-soft px-5 py-3.5">
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">Perubahan langsung tersedia di halaman belajar.</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn h-9 w-9" aria-label="Tutup editor">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="q-title">
                Judul soal
              </label>
              <input
                id="q-title"
                value={draft.title}
                onChange={(event) => {
                  const titleValue = event.target.value;
                  setDraft((current) => ({
                    ...current,
                    title: titleValue,
                    slug: slugTouched ? current.slug : slugify(titleValue),
                  }));
                }}
                className="input"
                placeholder="Contoh: Jumlahkan dua angka"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="q-slug">
                Slug
              </label>
              <input
                id="q-slug"
                value={draft.slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  patch({ slug: slugify(event.target.value) });
                }}
                className="input font-mono text-xs"
                placeholder="jumlahkan-dua-angka"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="q-lesson">
                Materi
              </label>
              <select
                id="q-lesson"
                value={draft.lessonSlug}
                onChange={(event) => patch({ lessonSlug: event.target.value })}
                className="input"
              >
                {lessons.map((lesson) => (
                  <option key={lesson.slug} value={lesson.slug}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="label">Tipe soal</span>
              <div className="flex rounded-md border border-border bg-surface p-0.5">
                {(
                  [
                    { id: "mcq" as QuestionType, label: "Pilihan ganda" },
                    { id: "code" as QuestionType, label: "Tantangan kode" },
                  ]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => patch({ type: item.id })}
                    className={cn(
                      "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                      draft.type === item.id
                        ? "bg-fg text-bg"
                        : "text-muted hover:text-fg",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="q-level">
                Kesulitan
              </label>
              <select
                id="q-level"
                value={draft.difficulty}
                onChange={(event) => patch({ difficulty: event.target.value as Level })}
                className="input"
              >
                <option value="pemula">Pemula</option>
                <option value="menengah">Menengah</option>
                <option value="mahir">Mahir</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="q-prompt">
              Instruksi soal
            </label>
            <textarea
              id="q-prompt"
              value={draft.prompt}
              onChange={(event) => patch({ prompt: event.target.value })}
              rows={5}
              className="input resize-y font-mono text-[12.5px]"
              placeholder="Tulis instruksi. Dukung markdown sederhana: **bold**, `code`, ```python ... ```"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="q-explanation">
                Penjelasan jawaban
              </label>
              <textarea
                id="q-explanation"
                value={draft.explanation ?? ""}
                onChange={(event) => patch({ explanation: event.target.value })}
                rows={3}
                className="input resize-y text-[12.5px]"
                placeholder="Muncul setelah pengguna menjawab."
              />
            </div>
            <div>
              <label className="label" htmlFor="q-hints">
                Petunjuk (satu per baris)
              </label>
              <textarea
                id="q-hints"
                value={hintsText}
                onChange={(event) => setHintsText(event.target.value)}
                rows={3}
                className="input resize-y text-[12.5px]"
                placeholder={"Gunakan operator +\nJangan lupa return"}
              />
            </div>
          </div>

          {draft.type === "mcq" ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="label mb-0">Pilihan jawaban</span>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  + Tambah pilihan
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {draft.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          options: current.options.map((item, itemIndex) => ({
                            ...item,
                            isCorrect: itemIndex === index,
                          })),
                        }))
                      }
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md border text-[10px] font-semibold transition-colors",
                        option.isCorrect
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-surface text-muted hover:border-fg/30",
                      )}
                      title="Tandai sebagai jawaban benar"
                    >
                      {String.fromCharCode(65 + index)}
                    </button>
                    <input
                      value={option.text}
                      onChange={(event) => updateOption(index, { text: event.target.value })}
                      className="input py-2 text-[12.5px]"
                      placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                    />
                    {draft.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            options: current.options.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                        aria-label="Hapus pilihan"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <span className="label">Jenis tantangan</span>
                <div className="flex rounded-md border border-border bg-surface p-0.5">
                  {(
                    [
                      { id: "python" as const, label: "Python" },
                      { id: "web" as const, label: "Web (HTML + CSS + JS)" },
                    ]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLanguage(item.id)}
                      className={cn(
                        "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors",
                        (draft.codeConfig?.language ?? "python") === item.id
                          ? "bg-fg text-bg"
                          : "text-muted hover:text-fg",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {draft.codeConfig?.language === "web" ? (
                <div className="space-y-3">
                  {(
                    [
                      { key: "html" as const, label: "HTML", hint: "<h1>Halo, LeCode!</h1>" },
                      { key: "css" as const, label: "CSS", hint: "h1 { color: #2547d0; }" },
                      { key: "js" as const, label: "JavaScript", hint: "console.log('Halo');" },
                    ]
                  ).map((item) => (
                    <div key={item.key}>
                      <label className="label" htmlFor={`q-web-${item.key}`}>
                        {item.label}
                      </label>
                      <textarea
                        id={`q-web-${item.key}`}
                        value={draft.codeConfig?.web?.[item.key] ?? ""}
                        onChange={(event) => updateWeb(item.key, event.target.value)}
                        rows={item.key === "js" ? 6 : 5}
                        className="input resize-y font-mono text-[11.5px]"
                        placeholder={item.hint}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div>
                    <label className="label" htmlFor="q-fn">
                      Nama fungsi yang diuji
                    </label>
                    <input
                      id="q-fn"
                      value={draft.codeConfig?.functionName ?? ""}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          codeConfig: current.codeConfig
                            ? { ...current.codeConfig, functionName: event.target.value }
                            : current.codeConfig,
                        }))
                      }
                      className="input font-mono text-xs"
                      placeholder="solve"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label" htmlFor="q-starter">
                        Starter code
                      </label>
                      <textarea
                        id="q-starter"
                        value={draft.codeConfig?.starterCode ?? ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            codeConfig: current.codeConfig
                              ? { ...current.codeConfig, starterCode: event.target.value }
                              : current.codeConfig,
                          }))
                        }
                        rows={7}
                        className="input resize-y font-mono text-[11.5px]"
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="q-solution">
                        Solusi referensi (opsional)
                      </label>
                      <textarea
                        id="q-solution"
                        value={draft.codeConfig?.solution ?? ""}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            codeConfig: current.codeConfig
                              ? { ...current.codeConfig, solution: event.target.value }
                              : current.codeConfig,
                          }))
                        }
                        rows={7}
                        className="input resize-y font-mono text-[11.5px]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <span className="label mb-0">{isWeb ? "Pemeriksaan otomatis" : "Test case"}</span>
                  <button
                    type="button"
                    onClick={addTestCase}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <Plus className="h-3 w-3" /> {isWeb ? "Tambah pemeriksaan" : "Tambah test"}
                  </button>
                </div>
                {isWeb && (
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    Tulis ekspresi JavaScript yang dijalankan di halaman pratinjau, mis.{" "}
                    <code className="rounded bg-surface-2 px-1 font-mono text-[10.5px]">
                      document.querySelector(&quot;h1&quot;).textContent
                    </code>
                    . Hasilnya dibandingkan dengan nilai JSON di kolom kedua.
                  </p>
                )}
                <div className="mt-2 space-y-2">
                  {draft.codeConfig?.testCases.map((test, index) => (
                    <div key={index} className="rounded-md border border-border bg-surface-2 p-2.5">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={test.args}
                          onChange={(event) => updateTestCase(index, { args: event.target.value })}
                          className="input py-1.5 font-mono text-[11.5px]"
                          placeholder={isWeb ? 'Ekspresi JS, mis. document.querySelector("h1").textContent' : 'Args JSON, mis. [3, 4]'}
                        />
                        <input
                          value={test.expected}
                          onChange={(event) => updateTestCase(index, { expected: event.target.value })}
                          className="input py-1.5 font-mono text-[11.5px]"
                          placeholder={isWeb ? 'Nilai JSON, mis. "Halo"' : 'Expected JSON, mis. 7'}
                        />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          value={test.description ?? ""}
                          onChange={(event) => updateTestCase(index, { description: event.target.value })}
                          className="input flex-1 py-1.5 text-[11.5px]"
                          placeholder="Deskripsi kasus uji"
                        />
                        <label className="inline-flex shrink-0 items-center gap-1.5 text-[11px] text-muted">
                          <input
                            type="checkbox"
                            checked={Boolean(test.isHidden)}
                            onChange={(event) => updateTestCase(index, { isHidden: event.target.checked })}
                            className="h-3.5 w-3.5 rounded border-border accent-[rgb(var(--primary))]"
                          />
                          hidden
                        </label>
                        {draft.codeConfig && draft.codeConfig.testCases.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((current) => ({
                                ...current,
                                codeConfig: current.codeConfig
                                  ? {
                                      ...current.codeConfig,
                                      testCases: current.codeConfig.testCases.filter(
                                        (_, testIndex) => testIndex !== index,
                                      ),
                                    }
                                  : current.codeConfig,
                              }))
                            }
                            className="grid h-8 w-8 place-items-center rounded-md text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                            aria-label="Hapus test case"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3.5 py-3">
            <input
              type="checkbox"
              checked={draft.isPublished}
              onChange={(event) => patch({ isPublished: event.target.checked })}
              className="h-4 w-4 rounded border-border accent-[rgb(var(--primary))]"
            />
            <span>
              <span className="block text-[12.5px] font-semibold">Publikasikan soal</span>
              <span className="block text-[11px] text-muted">Jika dimatikan, soal disembunyikan dari pembelajar.</span>
            </span>
          </label>

          {error && (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="sticky bottom-0 -mx-5 flex items-center justify-end gap-2 border-t border-border bg-bg-soft px-5 py-3">
            <button type="button" onClick={onClose} className="btn-ghost">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan…" : "Simpan soal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
