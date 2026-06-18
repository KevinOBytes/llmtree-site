import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/ui/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LLM Tree of Life — The Complete AI Model Lineage",
    template: "%s | LLM Tree of Life",
  },
  description:
    "Explore the evolutionary tree of every major large language model — from the 2017 Transformer paper to today's frontier models. Interactive dendrograms, research paper lineages, and hardware acceleration timelines.",
  keywords: [
    "LLM",
    "AI models",
    "GPT",
    "Claude",
    "Gemini",
    "LLaMA",
    "lineage",
    "tree of life",
    "transformer",
    "machine learning",
    "AI history",
  ],
  authors: [{ name: "LLM Tree of Life Contributors" }],
  openGraph: {
    title: "LLM Tree of Life — The Complete AI Model Lineage",
    description:
      "Interactive visualization of every frontier AI model's lineage, from foundational papers to today.",
    type: "website",
    locale: "en_US",
    siteName: "LLM Tree of Life",
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM Tree of Life",
    description:
      "The complete evolutionary tree of AI models — GPT, Claude, Gemini, LLaMA, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-surface-primary text-text-primary">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
