"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely without exposing diagnostic sensitive information
    console.error("Application error captured:", error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-5">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3F2] text-[#B42318]">
        <AlertTriangle className="h-6 w-6" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[#17212F]">Something went wrong</h2>
        <p className="text-xs text-[#5B6573] leading-relaxed">
          An unexpected issue occurred while rendering this section. Our team has been notified.
          You can try refreshing the page or returning to the dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B44AA] transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] bg-white px-4 py-2 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA] transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
