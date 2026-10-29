import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import DemoBanner from "@/components/ui/DemoBanner";
import { Analytics } from "@vercel/analytics/next";

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
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Awaz | Public Consumer Issue Tracker India",
    description:
      "Share consumer experiences, explore reported issues, and follow publicly documented progress. Awaz is an independent platform, not a government grievance service.",
    url: siteUrl,
    siteName: "Awaz",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Awaz — One issue. Many voices. Visible evidence.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Awaz | Public Consumer Issue Tracker India",
    description:
      "Share consumer experiences, explore reported issues, and follow publicly documented progress. Awaz is an independent platform, not a government grievance service.",
    images: ["/og-image.png"],
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
        <Analytics
          beforeSend={(event) => {
            // Strip any query strings to safeguard consumer report privacy
            if (event.url.includes("?")) {
              try {
                const parsed = new URL(event.url, "https://awaz.suvidhatools.in");
                return { ...event, url: parsed.pathname };
              } catch {
                return event;
              }
            }
            return event;
          }}
        />
      </body>
    </html>
  );
}
