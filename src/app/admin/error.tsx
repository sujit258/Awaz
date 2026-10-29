"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldAlert, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard error captured:", error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3F2] text-[#B42318]">
        <ShieldAlert className="h-6 w-6" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-[#17212F]">Moderation Console Error</h2>
        <p className="text-xs text-[#5B6573] leading-relaxed">
          An error occurred while loading moderation records. This could be due to a session timeout or a network disruption.
        </p>
      </div>

      <div className="flex justify-center gap-3 pt-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B44AA]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Moderation Console</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] bg-white px-4 py-2 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA]"
        >
          Exit to Dashboard
        </Link>
      </div>
    </div>
  );
}
