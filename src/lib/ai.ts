import type { Question } from "./types";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export function buildSystemPrompt(question: Pick<Question, "title" | "prompt" | "type" | "hints">, code: string, lastOutput: string) {
  return `Kamu adalah "Len", asisten belajar coding di platform LeCode (Learn Code).
Gaya bicara: ramah, singkat, memakai bahasa Indonesia santai tapi jelas. Panggil pengguna dengan "kamu".

KONTEKS SOAL
- Judul: ${question.title}
- Tipe: ${question.type === "code" ? "tantangan menulis kode Python" : "pilihan ganda"}
- Instruksi: ${question.prompt.replace(/\n+/g, " ").slice(0, 800)}
- Petunjuk yang tersedia: ${question.hints.join(" | ") || "-"}
- Kode pengguna saat ini:
\`\`\`python
${code.slice(0, 1500) || "(belum ada kode)"}
\`\`\`
- Hasil eksekusi terakhir: ${lastOutput.slice(0, 600) || "(belum dijalankan)"}

ATURAN
1. JANGAN langsung memberi jawaban lengkap pada pesan pertama. Beri petunjuk bertahap dan ajukan satu pertanyaan pemandu.
2. Jika pengguna sudah mencoba 2-3 kali atau secara eksplisit meminta solusi, barulah tunjukkan potongan solusi singkat beserta alasannya.
3. Untuk soal pilihan ganda, jangan sebut opsi yang benar; jelaskan konsepnya.
4. Jika kode error, tunjukkan baris/penyebabnya dan cara memperbaikinya, bukan menulis ulang seluruh kode.
5. Maksimal 6 baris kecuali pengguna meminta penjelasan detail. Sertakan contoh kode pendek bila membantu.
6. Jangan membahas topik di luar pemrograman dan pembelajaran LeCode.`;
}

export function buildGeneralSystemPrompt() {
  return `Kamu adalah "Len", asisten belajar coding di platform LeCode (Learn Code).
Gaya bicara: ramah, singkat, memakai bahasa Indonesia santai tapi jelas. Panggil pengguna dengan "kamu".

MODE
Pengguna tidak sedang membuka soal tertentu. Bantu mereka dengan:
- Dasar Python: variabel, tipe data, kondisi, loop, fungsi, list, dictionary, dan error umum.
- Cara memakai LeCode: menu Belajar (materi, kuis, tantangan kode + terminal), Game (Let's defeat the boss & Touch the Bug), Roadmap, Lapor/Saran, mode gelap/terang.
- Arah belajar: urutan materi, latihan berikutnya, dan tips konsisten.

ATURAN
1. Jawab langsung dan ringkas. Maksimal 8 baris kecuali pengguna meminta detail.
2. Jika pengguna tampak mengerjakan soal, beri petunjuk bertahap dan ajukan satu pertanyaan pemandu — jangan langsung membocorkan jawaban.
3. Sertakan contoh kode pendek bila membantu, dalam blok \`\`\`python.
4. Jangan membahas topik di luar pemrograman dan pembelajaran LeCode; tolak dengan sopan.
5. Jangan mengarang fitur LeCode. Fitur yang tersedia hanya yang disebut di atas.`;
}

const codeHints = [
  {
    match: /print\s*\(/,
    hint: "Di tantangan ini kamu perlu `return`, bukan `print`. Nilai yang hanya dicetak tidak bisa diperiksa test case.",
  },
  {
    match: /pass\s*$/m,
    hint: "Masih ada `pass` di kodemu — itu hanya placeholder. Ganti dengan logika sebenarnya.",
  },
  {
    match: /^\s*(if|for|while|def|elif|else)[^:\n]*$/m,
    hint: "Sepertinya ada baris `if/for/while/def` yang belum diakhiri titik dua `:`.",
  },
  {
    match: /range\s*\(\s*\d+\s*\)/,
    hint: "Ingat `range(n)` berhenti sebelum `n`. Untuk 1 sampai n inklusif, gunakan `range(1, n + 1)`.",
  },
  {
    match: /==\s*True|==\s*False/,
    hint: "Perbandingan `== True` tidak perlu — cukup tulis kondisi boolean-nya langsung.",
  },
];


export function buildFallbackReply({
  question,
  code,
  message,
  attempt = 0,
}: {
  question: Pick<Question, "title" | "type" | "hints" | "explanation">;
  code: string;
  message: string;
  attempt?: number;
}) {
  const text = message.toLowerCase();
  const wantsHint = /petunjuk|hint|bingung|mulai|bantu|gimana|bagaimana|caranya/.test(text);
  const wantsError = /error|salah|gagal|kenapa|why|traceback/.test(text);
  const noAnswer = /jangan\s+(kasih|beri|tunjuk|bocor|spoil)|jangan\s+jawab|tanpa\s+jawaban|jangan\s+langsung/.test(
    text,
  );
  const wantsSolution = !noAnswer && /jawaban|jawab|solusi|kode lengkap|contoh kode/.test(text);

  const matched = codeHints.find((item) => item.match.test(code));

  if (!noAnswer && (wantsSolution || attempt >= 2)) {
    return [
      `Oke, kita bedah pelan-pelan — tapi coba tulis dulu versimu setelah membaca ini ya.`,
      ``,
      question.explanation
        ? `Inti soalnya: ${question.explanation}`
        : `Inti soalnya: pecah masalah menjadi langkah kecil, lalu kembalikan hasilnya dengan \`return\`.`,
      ``,
      `Pola umum yang bisa kamu pakai: siapkan variabel penampung → proses dengan loop/kondisi → kembalikan hasil. Setelah itu tekan **Jalankan kode** dan lihat test mana yang masih gagal.`,
    ].join("\n");
  }

  if (wantsError) {
    return [
      matched ? matched.hint : "Coba jalankan dulu kodemu, lalu kirim pesan error yang muncul. Aku bantu membaca penyebabnya.",
      ``,
      `Sambil menunggu, periksa tiga hal ini: (1) nama fungsi harus sama dengan instruksi, (2) indentasi konsisten 4 spasi, (3) pastikan ada \`return\` di akhir fungsi.`,
    ].join("\n");
  }

  if (wantsHint) {
    const hint = question.hints[0] ?? "Baca ulang instruksi dan tandai kata kunci: apa input-nya, apa output yang diharapkan?";
    return [
      `Petunjuk pertama: ${hint}`,
      matched ? `\nSelain itu: ${matched.hint}` : "",
      ``,
      `Coba tulis satu langkah dulu, lalu jalankan. Kalau belum lolos, kirim hasilnya ke sini.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Menarik! Sebelum aku jawab, aku ingin tahu cara berpikirmu: menurutmu langkah pertama untuk menyelesaikan "${question.title}" itu apa?`,
    ``,
    question.hints[0] ? `Kecil petunjuk: ${question.hints[0]}` : "Coba identifikasi input dan output yang diminta.",
  ].join("\n");
}


export function buildGeneralFallbackReply({ message }: { message: string }) {
  const text = message.toLowerCase();

  const rules: Array<{ match: RegExp; reply: string[] }> = [
    {
      match: /mulai|pemula|dari mana|urutan|roadmap|belajar apa|langkah/,
      reply: [
        "Mulai dari **Python Pertama: Variabel & print** di menu Belajar. Setelah itu lanjut ke kondisi, loop, lalu fungsi.",
        "",
        "Alurnya: baca materi → kerjakan kuis → tantangan kode → cek Roadmap. 20–30 menit sehari sudah cukup.",
      ],
    },
    {
      match: /variabel|tipe data|string|integer|float|boolean/,
      reply: [
        "Variabel adalah nama untuk menyimpan nilai. Contoh: `nama = \"Len\"`, `umur = 17`, `tinggi = 158.5`.",
        "",
        "Tipe data dasar Python: `str` (teks), `int` (bilangan bulat), `float` (desimal), dan `bool` (`True`/`False`).",
      ],
    },
    {
      match: /fungsi|function|\bdef\b|return/,
      reply: [
        "Fungsi dibuat dengan `def`, menerima parameter, dan mengembalikan nilai memakai `return`.",
        "",
        "```python\ndef sapa(nama):\n    return f\"Halo, {nama}!\"\n\nprint(sapa(\"Len\"))\n```",
        "",
        "`print()` hanya menampilkan, sedangkan `return` mengirim nilai ke pemanggil.",
      ],
    },
    {
      match: /loop|perulangan|\bfor\b|\bwhile\b|range/,
      reply: [
        "`for` dipakai untuk mengulang sejumlah data, `while` selama kondisi masih benar.",
        "",
        "```python\nfor i in range(1, 4):\n    print(i)\n```",
        "",
        "Ingat: `range(1, 4)` berhenti sebelum 4, jadi hasilnya 1, 2, 3.",
      ],
    },
    {
      match: /error|salah|gagal|traceback|kenapa kode/,
      reply: [
        "Kirim pesan error atau baris kodenya, ya. Tanpa itu aku hanya bisa menebak.",
        "",
        "Tiga penyebab paling sering: indentasi tidak konsisten, nama variabel salah ketik, dan memakai `print` padahal seharusnya `return`.",
      ],
    },
    {
      match: /game|boss|bug zap|touch the bug/,
      reply: [
        "Ada dua game: **Let's defeat the boss** (jawab soal untuk menyerang bos) dan **Touch the Bug** (ketuk bug sebelum lolos).",
        "",
        "Game bagus untuk mengulang konsep, tapi tetap utamakan latihan kode di menu Belajar.",
      ],
    },
    {
      match: /kamu siapa|siapa kamu|\blen\b|asisten/,
      reply: [
        "Aku **Len**, asisten belajar LeCode. Aku bisa menjelaskan konsep Python, memberi petunjuk saat kamu macet, dan menunjukkan urutan belajar.",
        "",
        "Kalau kamu sedang mengerjakan soal, buka soalnya dulu — aku otomatis tahu konteksnya.",
      ],
    },
  ];

  const found = rules.find((rule) => rule.match.test(text));
  if (found) return found.reply.join("\n");

  return [
    "Aku di sini untuk membantu belajar coding. Coba tanya salah satu ini:",
    "",
    "- Dari mana mulai belajar Python?",
    "- Apa bedanya `return` dan `print`?",
    "- Kenapa kodeku error?",
    "",
    "Kalau sedang mengerjakan soal, buka soalnya dulu supaya aku bisa memberi petunjuk yang tepat.",
  ].join("\n");
}

