import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/ui/Header";
import { ClientAnalytics } from "@/components/ui/ClientAnalytics";
import { ConsentContainer } from "@/components/ui/ConsentContainer";
import { Analytics } from "@vercel/analytics/react";
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const isVercelRuntime = process.env.VERCEL === "1";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/feed.xml"
          title="LLM Tree of Life — Newly Released Models"
        />
        {GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="min-h-dvh flex flex-col bg-surface-primary text-text-primary">
        <ClientAnalytics />
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <ConsentContainer />
        {isVercelRuntime && <Analytics />}
      </body>
    </html>
  );
}
