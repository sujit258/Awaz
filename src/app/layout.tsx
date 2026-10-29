import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DemoBanner from "@/components/ui/DemoBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Awaz — Independent Public Consumer Evidence Platform",
  description:
    "One issue. Many voices. Visible evidence. An independent public-interest platform turning isolated consumer delivery issues into credible aggregated evidence and collective accountability.",
  keywords: [
    "consumer complaints",
    "delivery delay",
    "Flipkart grievance",
    "consumer rights India",
    "evidence-backed complaints",
    "collective action",
  ],
  authors: [{ name: "Awaz Public Interest Initiative" }],
  openGraph: {
    title: "Awaz — Independent Public Consumer Evidence Platform",
    description: "One issue. Many voices. Visible evidence.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://awaz.org",
    siteName: "Awaz",
    locale: "en_IN",
    type: "website",
  },
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = process.env.DEMO_MODE === "true";

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F8FA] text-[#17212F]">
        {isDemo && <DemoBanner />}
        <Suspense fallback={<div className="h-16 border-b border-[#E1E5EB] bg-white" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
