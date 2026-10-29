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

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://awaz.suvidhatools.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Awaz | Public Consumer Issue Tracker India",
    template: "%s | Awaz",
  },
  description:
    "Share consumer experiences, explore reported issues, and follow publicly documented progress. Awaz is an independent platform, not a government grievance service.",
  keywords: [
    "consumer complaints",
    "delivery delay",
    "Flipkart grievance",
    "consumer rights India",
    "evidence-backed complaints",
    "consumer tracker",
  ],
  authors: [{ name: "Awaz Independent Public Initiative" }],
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Awaz | Public Consumer Issue Tracker India",
    description:
      "Share consumer experiences, explore reported issues, and follow publicly documented progress. Awaz is an independent platform, not a government grievance service.",
    url: siteUrl,
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
