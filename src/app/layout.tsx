import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LenProvider } from "@/components/learn/len-context";
import { LenLauncher } from "@/components/learn/LenLauncher";
import { ThemeProvider } from "./providers";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LeCode — Learn Code, selangkah demi selangkah",
    template: "%s · LeCode",
  },
  description:
    "LeCode adalah platform belajar coding interaktif: kuis pilihan ganda, tantangan menulis kode dengan terminal, game 2D melawan bos, dan roadmap belajar yang jelas.",
  keywords: ["belajar coding", "python", "kuis coding", "game coding", "roadmap programmer"],
  authors: [{ name: "LeCode" }],
  openGraph: {
    title: "LeCode — Learn Code",
    description: "Belajar coding lewat kuis, terminal, game 2D, dan roadmap.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider>
          <LenProvider>
            <a
              href="#konten"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-fg focus:px-4 focus:py-2 focus:text-sm focus:text-bg"
            >
              Lompat ke konten
            </a>
            <Header />
            <main id="konten" className="relative">
              {children}
            </main>
            <SiteFooter />
            <LenLauncher />
          </LenProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
