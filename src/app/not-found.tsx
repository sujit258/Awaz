import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-xl border border-[#E1E5EB] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F7F8FA] text-[#5B6573] mb-4">
          <FileQuestion className="h-7 w-7 text-[#2457D6]" />
        </div>
        <span className="inline-block text-xs font-semibold tracking-wider text-[#2457D6] uppercase mb-2">
          404 Error
        </span>
        <h1 className="text-2xl font-bold text-[#17212F] mb-2">Page Not Found</h1>
        <p className="text-sm text-[#5B6573] mb-6 leading-relaxed">
          The requested page or complaint record could not be found. It may have been moved, removed, or is private.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2457D6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>
          <Link
            href="/issues"
            className="inline-flex items-center justify-center rounded-lg bg-[#F7F8FA] px-4 py-2.5 text-sm font-semibold text-[#17212F] hover:bg-[#E1E5EB] transition-colors"
          >
            Explore Issues
          </Link>
        </div>
      </div>
    </div>
  );
}
