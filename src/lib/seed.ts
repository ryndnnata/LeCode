import type { GameLevel, Lesson, Question, RoadmapNode } from "./types";

/* ------------------------------------------------------------------ */
/*  Data demo — dipakai otomatis saat Sanity belum dikonfigurasi.      */
/*  Struktur field sengaja sama dengan skema Sanity agar mudah pindah. */
/* ------------------------------------------------------------------ */

export const seedLessons: Lesson[] = [
  {
    _id: "lesson-python-dasar",
    title: "Python Pertama: Variabel & print",
    slug: "python-dasar",
    topic: "Python",
    level: "pemula",
    order: 1,
    summary:
      "Kenalan dengan Python, menyimpan nilai di variabel, dan menampilkan hasilnya ke layar.",
    estimatedMinutes: 12,
    tags: ["dasar", "variabel", "output"],
    content: `## Apa itu Python?

Python adalah bahasa pemrograman yang dibaca seperti bahasa manusia. Karena itu Python jadi bahasa paling ramah untuk pemula.

\`\`\`python
print("Halo, LeCode!")
\`\`\`

Baris di atas memanggil **fungsi** \`print()\` untuk menampilkan teks ke layar. Teks di dalam tanda kutip disebut *string*.

## Variabel: kotak penyimpan nilai

Variabel adalah nama yang menunjuk ke sebuah nilai.

\`\`\`python
nama = "Len"
umur = 17
tinggi = 158.5
sedang_belajar = True
\`\`\`

Empat tipe data paling sering kamu pakai:

- **str** — teks, selalu di dalam kutip: \`"halo"\`
- **int** — bilangan bulat: \`42\`
- **float** — bilangan desimal: \`3.14\`
- **bool** — hanya \`True\` atau \`False\`

## Aturan penamaan

- Boleh huruf, angka, dan garis bawah, tetapi **tidak boleh diawali angka**.
- Gunakan huruf kecil dan garis bawah: \`total_harga\`, bukan \`TotalHarga\`.
- Nama bersifat *case sensitive*: \`nama\` berbeda dengan \`Nama\`.

## Menggabungkan teks

\`\`\`python
nama = "Len"
print("Halo, " + nama)         # Halo, Len
print(f"Halo, {nama}!")        # f-string, lebih rapi
\`\`\`

## Yang perlu diingat

Python peka terhadap **indentasi** (spasi di awal baris). Untuk sekarang, tulis semua kode rata kiri.`,
  },
  {
    _id: "lesson-percabangan",
    title: "Percabangan: if, elif, else",
    slug: "percabangan",
    topic: "Python",
    level: "pemula",
    order: 2,
    summary: "Ajari program mengambil keputusan berdasarkan kondisi yang kamu tentukan.",
    estimatedMinutes: 14,
    tags: ["if", "kondisi", "logika"],
    content: `## Membuat keputusan

Program yang baik bisa memilih jalan. Di Python, alatnya adalah \`if\`.

\`\`\`python
nilai = 85

if nilai >= 80:
    print("Hebat!")
else:
    print("Terus belajar!")
\`\`\`

Perhatikan titik dua (\`:\`) di akhir baris \`if\`, lalu baris berikutnya **menjorok ke dalam** (4 spasi). Blok itulah yang dijalankan bila kondisi benar.

## elif: banyak kemungkinan

\`\`\`python
if nilai >= 90:
    grade = "A"
elif nilai >= 80:
    grade = "B"
elif nilai >= 70:
    grade = "C"
else:
    grade = "D"
\`\`\`

Python memeriksa dari atas ke bawah dan **berhenti di kondisi pertama yang benar**.

## Operator pembanding

| Operator | Arti |
| --- | --- |
| \`==\` | sama dengan |
| \`!=\` | tidak sama dengan |
| \`>\`, \`>=\` | lebih besar (atau sama) |
| \`<\`, \`<=\` | lebih kecil (atau sama) |

## Operator logika

- \`and\` — kedua kondisi harus benar
- \`or\` — salah satu benar saja cukup
- \`not\` — membalik nilai

\`\`\`python
if umur >= 17 and punya_ktp:
    print("Boleh membuat SIM")
\`\`\`

## Jebakan umum

Menulis \`=\` (memberi nilai) padahal maksudnya \`==\` (membandingkan) adalah kesalahan pemula nomor satu.`,
  },
  {
    _id: "lesson-perulangan",
    title: "Perulangan: for & while",
    slug: "perulangan",
    topic: "Python",
    level: "pemula",
    order: 3,
    summary: "Ulangi pekerjaan membosankan tanpa menulis kode yang sama berulang kali.",
    estimatedMinutes: 15,
    tags: ["loop", "for", "while", "range"],
    content: `## for: mengulang sejumlah kali

\`\`\`python
for i in range(5):
    print(i)
\`\`\`

\`range(5)\` menghasilkan 0, 1, 2, 3, 4 — **berhenti sebelum 5**.

\`\`\`python
range(2, 6)      # 2, 3, 4, 5
range(0, 10, 3)  # 0, 3, 6, 9
\`\`\`

## Menelusuri list

\`\`\`python
buah = ["apel", "jeruk", "mangga"]
for item in buah:
    print(item)
\`\`\`

## while: selama kondisi benar

\`\`\`python
energi = 3
while energi > 0:
    print("Latihan sekali lagi")
    energi -= 1
\`\`\`

Pastikan sesuatu di dalam loop **mengubah kondisi**, kalau tidak loop akan berjalan selamanya.

## break & continue

\`\`\`python
for n in range(10):
    if n == 4:
        break        # keluar dari loop
    if n % 2 == 0:
        continue     # lewati sisa blok, lanjut iterasi berikutnya
    print(n)         # 1, 3
\`\`\`

## Pola akumulasi

Pola paling berguna di dunia nyata: menyimpan hasil sementara.

\`\`\`python
total = 0
for n in range(1, 6):
    total += n       # total = total + n
print(total)         # 15
\`\`\``,
  },
  {
    _id: "lesson-fungsi",
    title: "Fungsi & parameter",
    slug: "fungsi",
    topic: "Python",
    level: "menengah",
    order: 4,
    summary: "Bungkus logika menjadi fungsi yang bisa dipakai berulang dan diuji otomatis.",
    estimatedMinutes: 16,
    tags: ["fungsi", "return", "parameter"],
    content: `## Kenapa fungsi?

Fungsi adalah blok kode bernama yang bisa dipanggil kapan saja. Ia membuat kode lebih pendek, mudah diuji, dan mudah dibaca.

\`\`\`python
def sapa(nama):
    return f"Halo, {nama}!"
\`\`\`

- \`def\` menandai definisi fungsi
- \`sapa\` adalah nama fungsi
- \`nama\` adalah **parameter**
- \`return\` mengirim nilai kembali ke pemanggil

\`\`\`python
hasil = sapa("Len")
print(hasil)     # Halo, Len!
\`\`\`

## return vs print

Ini pembeda penting:

- \`print()\` hanya menampilkan ke layar.
- \`return\` **mengembalikan nilai** agar bisa diolah lagi.

Fungsi yang hanya \`print\` tidak bisa dijumlahkan, dibandingkan, atau diuji. Di LeCode, hampir semua tantangan meminta \`return\`.

\`\`\`python
def tambah(a, b):
    return a + b

def tambah_salah(a, b):
    print(a + b)

x = tambah(2, 3)        # x = 5
y = tambah_salah(2, 3)  # mencetak 5, tetapi y = None
\`\`\`

## Nilai default

\`\`\`python
def pangkat(base, exp=2):
    return base ** exp

pangkat(5)      # 25
pangkat(2, 10)  # 1024
\`\`\`

## Tanpa return = mengembalikan None

Setiap fungsi Python selalu mengembalikan sesuatu. Jika tidak ada \`return\`, nilainya \`None\`.`,
  },
  {
    _id: "lesson-list-dict",
    title: "List & Dictionary",
    slug: "list-dictionary",
    topic: "Python",
    level: "menengah",
    order: 5,
    summary: "Simpan banyak data dalam satu variabel dan ambil kembali dengan cepat.",
    estimatedMinutes: 18,
    tags: ["list", "dictionary", "struktur data"],
    content: `## List: urutan nilai

\`\`\`python
nilai = [80, 92, 75, 88]
print(nilai[0])    # 80  (index mulai dari 0)
print(nilai[-1])   # 88  (dari belakang)
print(len(nilai))  # 4
\`\`\`

## Mengubah list

\`\`\`python
nilai.append(100)     # tambah di akhir
nilai[1] = 95         # ganti elemen
nilai.remove(75)      # hapus berdasarkan nilai
urut = sorted(nilai)  # salinan terurut
\`\`\`

## Slicing

\`\`\`python
angka = [10, 20, 30, 40, 50]
angka[1:4]    # [20, 30, 40]
angka[:2]     # [10, 20]
angka[::2]    # [10, 30, 50]
\`\`\`

## Dictionary: data berlabel

\`\`\`python
siswa = {"nama": "Len", "umur": 17, "nilai": 92}
print(siswa["nama"])       # Len
print(siswa.get("kelas"))  # None (tidak error)
\`\`\`

\`\`\`python
siswa["kelas"] = "XI-A"     # tambah / ubah
del siswa["umur"]           # hapus
for kunci, nilai in siswa.items():
    print(kunci, nilai)
\`\`\`

## Kapan pakai apa?

- **List** — saat urutan penting dan datanya sejenis: daftar nilai, daftar tugas.
- **Dictionary** — saat butuh label: profil pengguna, konfigurasi.

## Menghitung dengan loop

\`\`\`python
total = 0
for n in nilai:
    total += n
rata = total / len(nilai)
\`\`\``,
  },
  {
    _id: "lesson-string",
    title: "String & manipulasi teks",
    slug: "string",
    topic: "Python",
    level: "menengah",
    order: 6,
    summary: "Olah teks: potong, gabung, ganti, dan hitung karakter.",
    estimatedMinutes: 14,
    tags: ["string", "slicing", "format"],
    content: `## String adalah urutan karakter

\`\`\`python
teks = "LeCode"
print(teks[0])     # L
print(teks[-1])    # e
print(teks[2:5])   # Cod
print(len(teks))   # 6
\`\`\`

## Method yang sering dipakai

\`\`\`python
"  halo  ".strip()        # "halo"
"HALO".lower()            # "halo"
"halo".upper()            # "HALO"
"a,b,c".split(",")        # ["a", "b", "c"]
"-".join(["a", "b"])      # "a-b"
"lecode".replace("e", "E")# "lEcodE"
"coding".startswith("co") # True
\`\`\`

## Mencari dan menghitung

\`\`\`python
kalimat = "belajar coding itu seru"
kalimat.find("coding")     # 8
kalimat.count("a")         # 4
"coding" in kalimat        # True
\`\`\`

## f-string untuk menyusun teks

\`\`\`python
nama = "Len"
level = 7
print(f"{nama} ada di level {level}")
print(f"Rata-rata: {85.5:.1f}")   # 1 angka di belakang koma
\`\`\`

## Loop per karakter

\`\`\`python
vokal = 0
for huruf in "lecode":
    if huruf in "aeiou":
        vokal += 1
print(vokal)   # 3
\`\`\`

## Ingat: string tidak bisa diubah langsung

\`\`\`python
teks = "halo"
# teks[0] = "H"  ← error
teks = "H" + teks[1:]   # buat string baru
\`\`\``,
  },
  {
    _id: "lesson-rekursi",
    title: "Rekursi: berpikir mundur",
    slug: "rekursi",
    topic: "Algoritma",
    level: "mahir",
    order: 7,
    summary: "Selesaikan masalah besar dengan memanggil dirimu sendiri pada versi yang lebih kecil.",
    estimatedMinutes: 20,
    tags: ["rekursi", "base case", "algoritma"],
    content: `## Ide dasar rekursi

Rekursi adalah fungsi yang memanggil dirinya sendiri. Setiap rekursi wajib punya dua bagian:

1. **Base case** — kondisi berhenti.
2. **Recursive case** — memanggil diri sendiri dengan masalah lebih kecil.

\`\`\`python
def faktorial(n):
    if n <= 1:          # base case
        return 1
    return n * faktorial(n - 1)   # recursive case
\`\`\`

Jejak pemanggilan \`faktorial(4)\`:

\`\`\`
faktorial(4) = 4 * faktorial(3)
             = 4 * 3 * faktorial(2)
             = 4 * 3 * 2 * faktorial(1)
             = 4 * 3 * 2 * 1 = 24
\`\`\`

## Tanpa base case = bencana

\`\`\`python
def salah(n):
    return salah(n - 1)   # RecursionError!
\`\`\`

Python membatasi kedalaman rekursi (sekitar 1000 level) untuk melindungi memori.

## Kapan rekursi tepat?

- Struktur data bercabang: folder, tree, JSON bersarang.
- Masalah yang terdefinisi secara rekursif: faktorial, Fibonacci, Tower of Hanoi.
- Divide and conquer: merge sort, binary search.

## Rekursi vs loop

| Aspek | Loop | Rekursi |
| --- | --- | --- |
| Kecepatan | Lebih cepat | Overhead pemanggilan |
| Keterbacaan | Kadang rumit | Sering lebih dekat ke definisi |
| Risiko | Loop tak berujung | Stack overflow |

Untuk pemula, tulis versi loop dulu, lalu bandingkan dengan versi rekursif.`,
  },
  {
    _id: "lesson-web-dasar",
    title: "Web Pertama: HTML, CSS & JavaScript",
    slug: "web-dasar",
    topic: "Web",
    level: "pemula",
    order: 8,
    summary:
      "Menyusun struktur halaman dengan HTML, mengatur tampilan lewat CSS, dan menambah interaksi dengan JavaScript.",
    estimatedMinutes: 15,
    tags: ["web", "html", "css", "javascript"],
    content: `## Tiga bahasa yang bekerja bersama

Setiap halaman web dibangun dari tiga lapisan:

| Lapisan | Berkas | Tugas |
| --- | --- | --- |
| HTML | \`index.html\` | Struktur dan isi halaman |
| CSS | \`styles.css\` | Warna, ukuran, dan tata letak |
| JavaScript | \`script.js\` | Perilaku dan interaksi |

## HTML: kerangka halaman

\`\`\`html
<h1 class="judul">Halo, LeCode!</h1>
<p>Belajar web itu seru.</p>
<button id="tombol">Klik aku</button>
\`\`\`

Tag \`<h1>\` adalah judul terbesar. Atribut \`class\` memberi nama supaya bisa diatur CSS, sedangkan \`id\` dipakai JavaScript untuk mengambil satu elemen secara unik.

## CSS: mengatur tampilan

\`\`\`css
.judul {
  color: #2547d0;
  font-size: 28px;
}

button {
  padding: 8px 14px;
  border-radius: 6px;
}
\`\`\`

Selektor \`.\` menunjuk class, sedangkan \`#\` menunjuk id.

## JavaScript: membuat halaman hidup

\`\`\`js
const tombol = document.querySelector("#tombol");
let nilai = 0;

tombol.addEventListener("click", () => {
  nilai += 1;
  console.log("Diklik", nilai, "kali");
});
\`\`\`

## Cara mencoba

Di tab **Latihan**, kamu mengedit tiga berkas di panel kiri lalu menekan **Jalankan**. Hasilnya muncul di pratinjau, dan pesan \`console.log()\` tampil di panel console.`,
  },
];

export const seedQuestions: Question[] = [
  {
    _id: "q-print-output",
    title: "Output dari print()",
    slug: "print-output",
    type: "mcq",
    difficulty: "pemula",
    points: 10,
    lessonSlug: "python-dasar",
    prompt: `Apa yang tercetak di layar oleh kode berikut?

\`\`\`python
print("Halo")
nama = "Len"
print(nama)
\`\`\``,
    explanation:
      "Python menjalankan baris berurutan. print() pertama mencetak Halo, lalu variabel nama berisi \"Len\" dan dicetak pada baris kedua.",
    hints: ["Baca kode dari atas ke bawah.", "print() hanya menampilkan, tidak mengubah nilai."],
    options: [
      { id: "a", text: "Halo\nLen", isCorrect: true },
      { id: "b", text: "Halo Len", isCorrect: false },
      { id: "c", text: "Len", isCorrect: false },
      { id: "d", text: "Error", isCorrect: false },
    ],
  },
  {
    _id: "q-tambah",
    title: "Jumlahkan dua angka",
    slug: "jumlahkan-dua-angka",
    type: "code",
    difficulty: "pemula",
    points: 20,
    lessonSlug: "python-dasar",
    prompt:
      "Buat fungsi `tambah(a, b)` yang mengembalikan hasil penjumlahan `a` dan `b`.\n\nGunakan `return`, bukan `print`.",
    explanation: "Fungsi cukup mengembalikan `a + b`. Tanpa return, hasilnya None dan test gagal.",
    hints: ["Gunakan operator +.", "Jangan lupa kata kunci return."],
    codeConfig: {
      language: "python",
      functionName: "tambah",
      starterCode: "def tambah(a, b):\n    # tulis jawabanmu di sini\n    pass\n",
      solution: "def tambah(a, b):\n    return a + b\n",
      testCases: [
        { args: "[2, 3]", expected: "5", description: "2 + 3" },
        { args: "[-1, 1]", expected: "0", description: "bilangan negatif" },
        { args: "[100, 250]", expected: "350", description: "angka besar", isHidden: true },
      ],
    },
  },
  {
    _id: "q-variabel-valid",
    title: "Nama variabel yang valid",
    slug: "nama-variabel",
    type: "mcq",
    difficulty: "pemula",
    points: 10,
    lessonSlug: "python-dasar",
    prompt: "Manakah nama variabel yang **valid** di Python?",
    explanation: "Nama variabel tidak boleh diawali angka dan tidak boleh memakai tanda hubung.",
    hints: ["Lihat karakter pertama.", "Python memakai garis bawah, bukan tanda hubung."],
    options: [
      { id: "a", text: "2nama", isCorrect: false },
      { id: "b", text: "nama-siswa", isCorrect: false },
      { id: "c", text: "nama_siswa", isCorrect: true },
      { id: "d", text: "class", isCorrect: false },
    ],
  },
  {
    _id: "q-if-else",
    title: "Hasil percabangan",
    slug: "hasil-percabangan",
    type: "mcq",
    difficulty: "pemula",
    points: 10,
    lessonSlug: "percabangan",
    prompt: `Perhatikan kode berikut:

\`\`\`python
nilai = 74

if nilai >= 90:
    print("A")
elif nilai >= 80:
    print("B")
elif nilai >= 70:
    print("C")
else:
    print("D")
\`\`\`

Apa yang tercetak?`,
    explanation: "74 tidak >= 90 dan tidak >= 80, tetapi >= 70 sehingga cabang elif kedua yang dijalankan.",
    hints: ["Periksa kondisi dari atas ke bawah.", "Berhenti di kondisi pertama yang benar."],
    options: [
      { id: "a", text: "A", isCorrect: false },
      { id: "b", text: "B", isCorrect: false },
      { id: "c", text: "C", isCorrect: true },
      { id: "d", text: "D", isCorrect: false },
    ],
  },
  {
    _id: "q-is-even",
    title: "Cek bilangan genap",
    slug: "cek-genap",
    type: "code",
    difficulty: "pemula",
    points: 20,
    lessonSlug: "percabangan",
    prompt:
      "Buat fungsi `is_even(n)` yang mengembalikan `True` bila `n` genap dan `False` bila ganjil.\n\nPetunjuk: operator modulo `%` memberi sisa pembagian.",
    explanation: "Bilangan genap memiliki sisa 0 saat dibagi 2: `return n % 2 == 0`.",
    hints: ["n % 2 menghasilkan 0 untuk bilangan genap.", "Bandingkan hasilnya dengan 0."],
    codeConfig: {
      language: "python",
      functionName: "is_even",
      starterCode: "def is_even(n):\n    # kembalikan True atau False\n    pass\n",
      solution: "def is_even(n):\n    return n % 2 == 0\n",
      testCases: [
        { args: "[4]", expected: "true", description: "4 genap" },
        { args: "[7]", expected: "false", description: "7 ganjil" },
        { args: "[0]", expected: "true", description: "nol dianggap genap", isHidden: true },
      ],
    },
  },
  {
    _id: "q-loop-count",
    title: "Berapa kali loop berjalan?",
    slug: "hitung-iterasi",
    type: "mcq",
    difficulty: "pemula",
    points: 10,
    lessonSlug: "perulangan",
    prompt: "Berapa angka yang tercetak oleh `for i in range(2, 9, 2): print(i)`?",
    explanation: "range(2, 9, 2) menghasilkan 2, 4, 6, 8 — empat angka.",
    hints: ["Batas akhir tidak termasuk.", "Langkahnya 2, dimulai dari 2."],
    options: [
      { id: "a", text: "3", isCorrect: false },
      { id: "b", text: "4", isCorrect: true },
      { id: "c", text: "5", isCorrect: false },
      { id: "d", text: "7", isCorrect: false },
    ],
  },
  {
    _id: "q-fizzbuzz",
    title: "FizzBuzz mini",
    slug: "fizzbuzz",
    type: "code",
    difficulty: "menengah",
    points: 25,
    lessonSlug: "perulangan",
    prompt:
      "Buat fungsi `fizzbuzz(n)` yang mengembalikan **list** berisi angka 1 sampai `n` dengan aturan:\n\n- kelipatan 3 → `\"Fizz\"`\n- kelipatan 5 → `\"Buzz\"`\n- kelipatan 3 dan 5 → `\"FizzBuzz\"`\n- selain itu → string angkanya, mis. `\"7\"`",
    explanation:
      "Periksa kelipatan 15 lebih dulu, lalu 3, lalu 5. Semua elemen dikembalikan sebagai string.",
    hints: ["Periksa kondisi FizzBuzz (habis dibagi 3 dan 5) paling awal.", "Gunakan append() ke list hasil."],
    codeConfig: {
      language: "python",
      functionName: "fizzbuzz",
      starterCode: `def fizzbuzz(n):
    hasil = []
    for i in range(1, n + 1):
        # lengkapi logikanya
        pass
    return hasil
`,
      solution: `def fizzbuzz(n):
    hasil = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            hasil.append("FizzBuzz")
        elif i % 3 == 0:
            hasil.append("Fizz")
        elif i % 5 == 0:
            hasil.append("Buzz")
        else:
            hasil.append(str(i))
    return hasil
`,
      testCases: [
        { args: "[5]", expected: '["1", "2", "Fizz", "4", "Buzz"]', description: "n = 5" },
        {
          args: "[15]",
          expected:
            '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]',
          description: "n = 15",
          isHidden: true,
        },
      ],
    },
  },
  {
    _id: "q-sum-to",
    title: "Jumlah 1 sampai n",
    slug: "jumlah-1-sampai-n",
    type: "code",
    difficulty: "pemula",
    points: 20,
    lessonSlug: "perulangan",
    prompt: "Buat fungsi `sum_to(n)` yang mengembalikan jumlah semua bilangan bulat dari 1 sampai `n`.",
    explanation: "Gunakan akumulator `total += i` di dalam loop, atau rumus n * (n + 1) // 2.",
    hints: ["Mulai dari total = 0.", "Gunakan range(1, n + 1)."],
    codeConfig: {
      language: "python",
      functionName: "sum_to",
      starterCode: "def sum_to(n):\n    total = 0\n    # tulis loop-mu\n    return total\n",
      solution: "def sum_to(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total\n",
      testCases: [
        { args: "[5]", expected: "15", description: "1+2+3+4+5" },
        { args: "[1]", expected: "1", description: "kasus terkecil" },
        { args: "[100]", expected: "5050", description: "n = 100", isHidden: true },
      ],
    },
  },
  {
    _id: "q-return-vs-print",
    title: "return vs print",
    slug: "return-vs-print",
    type: "mcq",
    difficulty: "menengah",
    points: 10,
    lessonSlug: "fungsi",
    prompt: "Apa nilai `x` setelah kode `def f(a): print(a)` lalu `x = f(5)` dijalankan?",
    explanation:
      "Fungsi tanpa return mengembalikan None. print() hanya menampilkan 5 ke layar, tidak mengembalikan nilai.",
    hints: ["Perhatikan kata kunci yang dipakai fungsi.", "Fungsi tanpa return selalu menghasilkan None."],
    options: [
      { id: "a", text: "5", isCorrect: false },
      { id: "b", text: "None", isCorrect: true },
      { id: "c", text: "0", isCorrect: false },
      { id: "d", text: "Error", isCorrect: false },
    ],
  },
  {
    _id: "q-faktorial",
    title: "Faktorial rekursif",
    slug: "faktorial",
    type: "code",
    difficulty: "mahir",
    points: 30,
    lessonSlug: "fungsi",
    prompt:
      "Buat fungsi `faktorial(n)` yang mengembalikan n! menggunakan rekursi.\n\nContoh: `faktorial(4)` → `24`. Untuk `n <= 1`, hasilnya `1`.",
    explanation: "Base case n <= 1 menghasilkan 1; selain itu n * faktorial(n - 1).",
    hints: ["Tentukan base case lebih dulu.", "Panggil fungsi yang sama dengan n - 1."],
    codeConfig: {
      language: "python",
      functionName: "faktorial",
      starterCode:
        "def faktorial(n):\n    # base case\n    # recursive case\n    pass\n",
      solution: "def faktorial(n):\n    if n <= 1:\n        return 1\n    return n * faktorial(n - 1)\n",
      testCases: [
        { args: "[1]", expected: "1", description: "base case" },
        { args: "[5]", expected: "120", description: "5!" },
        { args: "[7]", expected: "5040", description: "7!", isHidden: true },
      ],
    },
  },
  {
    _id: "q-sapa",
    title: "Fungsi sapaan",
    slug: "fungsi-sapaan",
    type: "code",
    difficulty: "pemula",
    points: 15,
    lessonSlug: "fungsi",
    prompt: 'Buat fungsi `sapa(nama)` yang mengembalikan teks `"Halo, <nama>!"`.',
    explanation: 'Gunakan f-string: return f"Halo, {nama}!"',
    hints: ["Gunakan f-string agar rapi.", "Perhatikan tanda seru dan spasi setelah koma."],
    codeConfig: {
      language: "python",
      functionName: "sapa",
      starterCode: "def sapa(nama):\n    # kembalikan teks sapaan\n    pass\n",
      solution: 'def sapa(nama):\n    return f"Halo, {nama}!"\n',
      testCases: [
        { args: '["Len"]', expected: '"Halo, Len!"', description: "nama Len" },
        { args: '["Budi"]', expected: '"Halo, Budi!"', description: "nama Budi" },
      ],
    },
  },
  {
    _id: "q-list-index",
    title: "Index pada list",
    slug: "index-list",
    type: "mcq",
    difficulty: "menengah",
    points: 10,
    lessonSlug: "list-dictionary",
    prompt: "Apa hasil dari `[10, 20, 30, 40][-2]`?",
    explanation: "Index negatif dihitung dari belakang: -1 = 40, -2 = 30.",
    hints: ["Index -1 adalah elemen terakhir.", "Hitung mundur satu langkah lagi."],
    options: [
      { id: "a", text: "20", isCorrect: false },
      { id: "b", text: "30", isCorrect: true },
      { id: "c", text: "40", isCorrect: false },
      { id: "d", text: "Error", isCorrect: false },
    ],
  },
  {
    _id: "q-rata-rata",
    title: "Rata-rata list",
    slug: "rata-rata",
    type: "code",
    difficulty: "menengah",
    points: 25,
    lessonSlug: "list-dictionary",
    prompt:
      "Buat fungsi `rata_rata(nilai)` yang menerima list angka dan mengembalikan rata-ratanya.\n\nKembalikan `0` bila list kosong.",
    explanation: "Jumlahkan dengan loop atau sum(), lalu bagi dengan len(nilai). Jaga kasus list kosong.",
    hints: ["sum(nilai) / len(nilai).", "Cek dulu apakah list kosong."],
    codeConfig: {
      language: "python",
      functionName: "rata_rata",
      starterCode: "def rata_rata(nilai):\n    # tangani list kosong, lalu hitung rata-rata\n    pass\n",
      solution:
        "def rata_rata(nilai):\n    if len(nilai) == 0:\n        return 0\n    return sum(nilai) / len(nilai)\n",
      testCases: [
        { args: "[[80, 90, 100]]", expected: "90.0", description: "tiga nilai" },
        { args: "[[]]", expected: "0", description: "list kosong" },
        { args: "[[5, 5]]", expected: "5.0", description: "nilai sama", isHidden: true },
      ],
    },
  },
  {
    _id: "q-hitung-kata",
    title: "Hitung frekuensi kata",
    slug: "hitung-frekuensi",
    type: "code",
    difficulty: "mahir",
    points: 30,
    lessonSlug: "list-dictionary",
    prompt:
      `Buat fungsi \`hitung_kata(teks)\` yang mengembalikan dictionary berisi jumlah kemunculan setiap kata.\n\nContoh: \`hitung_kata("a b a")\` → \`{"a": 2, "b": 1}\`. Kata dipisahkan spasi.`,
    explanation: "Pecah dengan split(), lalu tambah hitungan di dictionary menggunakan get(kata, 0) + 1.",
    hints: ["teks.split() memecah berdasarkan spasi.", "dict.get(kunci, 0) menghindari KeyError."],
    codeConfig: {
      language: "python",
      functionName: "hitung_kata",
      starterCode: `def hitung_kata(teks):
    hasil = {}
    # hitung setiap kata
    return hasil
`,
      solution: `def hitung_kata(teks):
    hasil = {}
    for kata in teks.split():
        hasil[kata] = hasil.get(kata, 0) + 1
    return hasil
`,
      testCases: [
        { args: '["a b a"]', expected: '{"a": 2, "b": 1}', description: "tiga kata" },
        { args: '["halo halo halo"]', expected: '{"halo": 3}', description: "kata berulang" },
      ],
    },
  },
  {
    _id: "q-slicing",
    title: "Slicing string",
    slug: "slicing-string",
    type: "mcq",
    difficulty: "menengah",
    points: 10,
    lessonSlug: "string",
    prompt: 'Apa hasil dari `"LeCode"[2:5]`?',
    explanation: "Index 2, 3, 4 diambil, index 5 tidak termasuk: C, o, d.",
    hints: ["Index awal termasuk, index akhir tidak.", "Hitung dari 0: L=0, e=1, C=2."],
    options: [
      { id: "a", text: "LeC", isCorrect: false },
      { id: "b", text: "Cod", isCorrect: true },
      { id: "c", text: "Code", isCorrect: false },
      { id: "d", text: "ode", isCorrect: false },
    ],
  },
  {
    _id: "q-balik-kata",
    title: "Balik urutan kata",
    slug: "balik-kata",
    type: "code",
    difficulty: "menengah",
    points: 20,
    lessonSlug: "string",
    prompt:
      'Buat fungsi `balik_kata(kalimat)` yang membalik urutan kata.\n\nContoh: `"saya suka koding"` → `"koding suka saya"`.',
    explanation: "split() lalu balik list dengan [::-1] dan gabungkan dengan join(' ').",
    hints: ["Pecah kalimat menjadi list kata.", "Gunakan [::-1] untuk membalik list."],
    codeConfig: {
      language: "python",
      functionName: "balik_kata",
      starterCode: 'def balik_kata(kalimat):\n    # balik urutan kata\n    pass\n',
      solution:
        'def balik_kata(kalimat):\n    kata = kalimat.split()\n    return " ".join(kata[::-1])\n',
      testCases: [
        { args: '["saya suka koding"]', expected: '"koding suka saya"', description: "tiga kata" },
        { args: '["halo"]', expected: '"halo"', description: "satu kata" },
      ],
    },
  },
  {
    _id: "q-hitung-vokal",
    title: "Hitung huruf vokal",
    slug: "hitung-vokal",
    type: "code",
    difficulty: "pemula",
    points: 20,
    lessonSlug: "string",
    prompt:
      'Buat fungsi `hitung_vokal(teks)` yang menghitung jumlah huruf vokal (a, i, u, e, o) tanpa membedakan huruf besar/kecil.',
    explanation: "Ubah teks ke lower(), lalu hitung karakter yang ada di \"aiueo\".",
    hints: ["lower() membuat pengecekan lebih mudah.", "Gunakan loop atau sum() dengan generator."],
    codeConfig: {
      language: "python",
      functionName: "hitung_vokal",
      starterCode: "def hitung_vokal(teks):\n    jumlah = 0\n    # hitung vokalnya\n    return jumlah\n",
      solution:
        'def hitung_vokal(teks):\n    jumlah = 0\n    for huruf in teks.lower():\n        if huruf in "aiueo":\n            jumlah += 1\n    return jumlah\n',
      testCases: [
        { args: '["lecode"]', expected: "3", description: "huruf kecil" },
        { args: '["AEIOU"]', expected: "5", description: "huruf besar" },
        { args: '["xyz"]', expected: "0", description: "tanpa vokal", isHidden: true },
      ],
    },
  },
  {
    _id: "q-base-case",
    title: "Base case rekursi",
    slug: "base-case",
    type: "mcq",
    difficulty: "mahir",
    points: 10,
    lessonSlug: "rekursi",
    prompt: "Apa yang terjadi bila fungsi rekursif tidak memiliki base case?",
    explanation:
      "Fungsi terus memanggil dirinya sendiri hingga melewati batas kedalaman stack, menghasilkan RecursionError.",
    hints: ["Ingat batas kedalaman rekursi Python.", "Stack memori terbatas."],
    options: [
      { id: "a", text: "Mengembalikan None", isCorrect: false },
      { id: "b", text: "Loop berjalan sekali", isCorrect: false },
      { id: "c", text: "RecursionError / stack overflow", isCorrect: true },
      { id: "d", text: "Otomatis berhenti di n = 0", isCorrect: false },
    ],
  },
  {
    _id: "q-fibonacci",
    title: "Fibonacci rekursif",
    slug: "fibonacci",
    type: "code",
    difficulty: "mahir",
    points: 30,
    lessonSlug: "rekursi",
    prompt:
      "Buat fungsi `fib(n)` yang mengembalikan bilangan Fibonacci ke-n.\n\nBarisan: 0, 1, 1, 2, 3, 5, 8, ... sehingga `fib(0) = 0`, `fib(1) = 1`.",
    explanation: "Base case n < 2 → n. Rekursif: fib(n-1) + fib(n-2).",
    hints: ["Dua base case: n == 0 dan n == 1.", "Jumlahkan dua pemanggilan sebelumnya."],
    codeConfig: {
      language: "python",
      functionName: "fib",
      starterCode: "def fib(n):\n    # base case lalu rekursi\n    pass\n",
      solution: "def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n",
      testCases: [
        { args: "[0]", expected: "0", description: "fib(0)" },
        { args: "[7]", expected: "13", description: "fib(7)" },
        { args: "[10]", expected: "55", description: "fib(10)", isHidden: true },
      ],
    },
  },
  {
    _id: "q-web-halo",
    title: "Halaman sapaan pertama",
    slug: "web-halo",
    type: "code",
    difficulty: "pemula",
    points: 20,
    lessonSlug: "web-dasar",
    prompt: `Lengkapi halaman sederhana di panel editor:

1. Judul \`<h1>\` harus memakai class **judul**.
2. Beri warna \`#2547d0\` untuk \`.judul\` lewat CSS.
3. Tulis \`console.log("Halaman siap")\` di JavaScript.

Tekan **Jalankan** untuk melihat pratinjau dan memeriksa hasilnya.`,
    explanation:
      "HTML menyusun isi, CSS mengatur warna, dan JavaScript menambah perilaku. Ketiganya digabung menjadi satu halaman di iframe pratinjau.",
    hints: [
      "Tambahkan class pada tag: <h1 class=\"judul\">.",
      "Di CSS tulis .judul { color: #2547d0; }.",
      "console.log() muncul di panel console.",
    ],
    codeConfig: {
      language: "web",
      functionName: "web",
      starterCode: "<h1>Halo, LeCode!</h1>\n",
      solution:
        '<h1 class="judul">Halo, LeCode!</h1>\n\n/* styles.css */\n.judul { color: #2547d0; }\n\n// script.js\nconsole.log("Halaman siap");\n',
      testCases: [
        {
          args: 'document.querySelector("h1")?.textContent.trim()',
          expected: '"Halo, LeCode!"',
          description: "teks judul",
        },
        {
          args: 'document.querySelector("h1")?.classList.contains("judul")',
          expected: "true",
          description: "class judul terpasang",
        },
        {
          args: 'getComputedStyle(document.querySelector(".judul")).color',
          expected: '"rgb(37, 71, 208)"',
          description: "warna judul #2547d0",
        },
      ],
      web: {
        html: "<h1>Halo, LeCode!</h1>\n",
        css: "/* beri warna judul di sini */\n",
        js: "// tampilkan pesan di console\n",
      },
    },
  },
  {
    _id: "q-web-penghitung",
    title: "Tombol penghitung",
    slug: "web-penghitung",
    type: "code",
    difficulty: "pemula",
    points: 25,
    lessonSlug: "web-dasar",
    prompt: `Buat penghitung sederhana.

Setiap kali tombol \`#tombol\` diklik, angka di dalam \`#angka\` harus bertambah 1. Nilai awalnya \`0\`.

Gunakan \`addEventListener("click", ...)\` di berkas JavaScript.`,
    explanation:
      "Ambil elemen dengan querySelector, simpan nilai di variabel, lalu perbarui textContent setiap klik.",
    hints: [
      "Simpan nilai awal: let nilai = 0.",
      "Di handler klik: nilai += 1 lalu angka.textContent = nilai.",
      "Jangan lupa memanggil addEventListener pada tombol.",
    ],
    codeConfig: {
      language: "web",
      functionName: "web",
      starterCode:
        '<button id="tombol">Tambah</button>\n<p>Klik: <span id="angka">0</span></p>\n',
      solution:
        'const tombol = document.querySelector("#tombol");\nconst angka = document.querySelector("#angka");\nlet nilai = 0;\n\ntombol.addEventListener("click", () => {\n  nilai += 1;\n  angka.textContent = nilai;\n});\n',
      testCases: [
        {
          args: 'document.querySelector("#angka")?.textContent.trim()',
          expected: '"0"',
          description: "nilai awal 0",
        },
        {
          args:
            '(() => { const tombol = document.querySelector("#tombol"); tombol.click(); tombol.click(); return document.querySelector("#angka").textContent.trim(); })()',
          expected: '"2"',
          description: "dua klik menambah dua",
        },
      ],
      web: {
        html: '<button id="tombol">Tambah</button>\n<p>Klik: <span id="angka">0</span></p>\n',
        css: "button { padding: 6px 14px; border-radius: 6px; }\n",
        js: 'const tombol = document.querySelector("#tombol");\nconst angka = document.querySelector("#angka");\n\nlet nilai = 0;\n\n// tambahkan event listener di sini\n',
      },
    },
  },
];

export const seedGames: GameLevel[] = [
  {
    _id: "game-boss",
    title: "Let's defeat the boss",
    slug: "boss-sintaks",
    gameType: "boss",
    description:
      "Bos raksasa mendekat setiap detik. Jawab soal koding dengan benar untuk memukul mundur dan mengalahkannya.",
    intro:
      "Kamu adalah Len, penjaga gerbang LeCode. Bos \"Sintaks Jahat\" menyerang! Setiap jawaban benar memberi damage dan mendorongnya mundur. Jawaban salah membuatnya maju lebih cepat.",
    config: { bossHp: 100, bossSpeed: 1, playerHp: 3, timeLimit: 15 },
    questionSlugs: [
      "print-output",
      "nama-variabel",
      "hasil-percabangan",
      "hitung-iterasi",
      "return-vs-print",
      "index-list",
      "slicing-string",
      "base-case",
    ],
    isPlayable: true,
  },
  {
    _id: "game-bugzap",
    title: "Touch the Bug",
    slug: "bug-zap",
    gameType: "bugzap",
    description:
      "Bug beterbangan menuju baris kodemu. Ketuk bug sebelum menyentuh kode, makin lama makin cepat.",
    intro:
      "Kode kamu sedang diserang bug! Ketuk atau klik setiap bug yang muncul. Setiap bug yang lolos mengurangi 1 nyawa.",
    config: { bossHp: 0, bossSpeed: 1, playerHp: 3, timeLimit: 45 },
    questionSlugs: [],
    isPlayable: true,
  },
];

export const seedRoadmap: RoadmapNode[] = [
  {
    _id: "rm-fondasi",
    title: "Fondasi Logika",
    slug: "fondasi-logika",
    description: "Variabel, tipe data, operator, dan alur program. Semua bahasa butuh ini.",
    stage: "Fondasi",
    order: 1,
    prerequisites: [],
    skills: ["Variabel", "Tipe data", "Input/output", "Operator"],
    resources: [{ label: "Lesson: Python Pertama", url: "/belajar/python-dasar" }],
  },
  {
    _id: "rm-percabangan",
    title: "Kontrol Alur",
    slug: "kontrol-alur",
    description: "Ajari program memilih dan mengulang: if, else, for, while.",
    stage: "Fondasi",
    order: 2,
    prerequisites: ["fondasi-logika"],
    skills: ["if/else", "for", "while", "break/continue"],
    resources: [
      { label: "Lesson: Percabangan", url: "/belajar/percabangan" },
      { label: "Lesson: Perulangan", url: "/belajar/perulangan" },
    ],
  },
  {
    _id: "rm-fungsi",
    title: "Fungsi & Modularitas",
    slug: "fungsi-modular",
    description: "Pecah program besar menjadi bagian kecil yang bisa diuji.",
    stage: "Fondasi",
    order: 3,
    prerequisites: ["kontrol-alur"],
    skills: ["Parameter", "Return", "Scope", "Refactor"],
    resources: [{ label: "Lesson: Fungsi & parameter", url: "/belajar/fungsi" }],
  },
  {
    _id: "rm-struktur",
    title: "Struktur Data",
    slug: "struktur-data",
    description: "List, dictionary, set, dan tuple — cara menyimpan banyak data.",
    stage: "Menengah",
    order: 4,
    prerequisites: ["fungsi-modular"],
    skills: ["List", "Dictionary", "Set", "Iterasi"],
    resources: [{ label: "Lesson: List & Dictionary", url: "/belajar/list-dictionary" }],
  },
  {
    _id: "rm-string",
    title: "String & Parsing",
    slug: "string-parsing",
    description: "Olah teks, validasi input, dan bersihkan data kotor.",
    stage: "Menengah",
    order: 5,
    prerequisites: ["struktur-data"],
    skills: ["Slicing", "split/join", "f-string", "Regex dasar"],
    resources: [{ label: "Lesson: String", url: "/belajar/string" }],
  },
  {
    _id: "rm-algoritma",
    title: "Algoritma Dasar",
    slug: "algoritma-dasar",
    description: "Sorting, searching, dan analisis kompleksitas Big-O secara santai.",
    stage: "Menengah",
    order: 6,
    prerequisites: ["struktur-data"],
    skills: ["Linear search", "Binary search", "Sorting", "Big-O"],
    resources: [{ label: "Lesson: Rekursi", url: "/belajar/rekursi" }],
  },
  {
    _id: "rm-rekursi",
    title: "Rekursi & Divide-Conquer",
    slug: "rekursi-divide",
    description: "Berpikir mundur: selesaikan masalah besar lewat versi kecilnya.",
    stage: "Mahir",
    order: 7,
    prerequisites: ["algoritma-dasar"],
    skills: ["Base case", "Recursion tree", "Memoization"],
    resources: [{ label: "Lesson: Rekursi", url: "/belajar/rekursi" }],
  },
  {
    _id: "rm-oop",
    title: "Object-Oriented Programming",
    slug: "oop",
    description: "Class, object, inheritance, dan composition untuk kode berskala.",
    stage: "Mahir",
    order: 8,
    prerequisites: ["struktur-data"],
    skills: ["Class", "Object", "Inheritance", "Composition"],
    resources: [],
  },
  {
    _id: "rm-web",
    title: "Web Interaktif",
    slug: "web-interaktif",
    description: "HTML, CSS, JavaScript, lalu React — bikin produk yang bisa dipakai orang.",
    stage: "Spesialisasi",
    order: 9,
    prerequisites: ["fungsi-modular", "oop"],
    skills: ["HTML/CSS", "DOM", "JavaScript", "React"],
    resources: [],
  },
  {
    _id: "rm-backend",
    title: "Backend & Database",
    slug: "backend-database",
    description: "API, autentikasi, SQL, dan cara menyimpan data dengan benar.",
    stage: "Spesialisasi",
    order: 10,
    prerequisites: ["web-interaktif"],
    skills: ["HTTP", "REST", "SQL", "Auth"],
    resources: [],
  },
  {
    _id: "rm-game",
    title: "Game Development",
    slug: "game-dev",
    description: "Game loop, physics, sprite, dan state machine — seperti game di LeCode ini.",
    stage: "Spesialisasi",
    order: 11,
    prerequisites: ["fungsi-modular", "algoritma-dasar"],
    skills: ["Game loop", "Collision", "Sprite", "State machine"],
    resources: [{ label: "Main: Boss Battle", url: "/game/boss-sintaks" }],
  },
  {
    _id: "rm-karier",
    title: "Portofolio & Karier",
    slug: "portofolio-karier",
    description: "Bangun 3 proyek nyata, tulis README yang baik, dan siapkan wawancara.",
    stage: "Spesialisasi",
    order: 12,
    prerequisites: ["web-interaktif", "backend-database"],
    skills: ["Git", "Dokumentasi", "Deploy", "Interview"],
    resources: [],
  },
];
