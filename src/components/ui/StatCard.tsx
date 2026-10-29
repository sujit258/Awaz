import Link from "next/link";
import { HelpCircle } from "lucide-react";
import React from "react";

interface StatCardProps {
  label: string;
  value: number | string;
  definition: string;
  subtext?: string;
  methodologyAnchor?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  definition,
  subtext,
  methodologyAnchor = "#definitions",
  icon,
  loading = false,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs animate-pulse">
        <div className="h-4 w-28 bg-gray-200 rounded mb-3"></div>
        <div className="h-8 w-20 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 w-40 bg-gray-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs hover:border-[#CBD2DC] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5B6573]">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {icon && <span className="text-[#5B6573]">{icon}</span>}
            <Link
              href={`/methodology${methodologyAnchor}`}
              className="text-[#5B6573] hover:text-[#2457D6] transition-colors p-0.5 rounded"
              title={`${definition} (Click to read counting methodology)`}
              aria-label={`Methodology definition for ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="my-2">
          <div className="text-3xl font-bold tracking-tight text-[#17212F] tabular-nums">
            {value}
          </div>
        </div>
      </div>

      <div>
        {subtext && (
          <p className="text-xs text-[#5B6573] border-t border-[#E1E5EB]/60 pt-2.5 mt-1 leading-snug">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
