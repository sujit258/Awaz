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
  accentColor?: "blue" | "teal" | "green" | "slate";
}

export default function StatCard({
  label,
  value,
  definition,
  subtext,
  methodologyAnchor = "#definitions",
  icon,
  loading = false,
  accentColor = "blue",
}: StatCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs animate-pulse">
        <div className="h-3.5 w-24 bg-gray-200 rounded mb-3"></div>
        <div className="h-8 w-16 bg-gray-300 rounded mb-2"></div>
        <div className="h-3 w-32 bg-gray-100 rounded"></div>
      </div>
    );
  }

  const borderAccents = {
    blue: "hover:border-[#2457D6]/50",
    teal: "hover:border-[#087E8B]/50",
    green: "hover:border-[#18794E]/50",
    slate: "hover:border-[#17212F]/40",
  };

  return (
    <div
      className={`group rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${borderAccents[accentColor]}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6573]">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {icon && (
              <span className="p-1 rounded-md bg-[#F7F8FA] text-[#5B6573] group-hover:text-[#2457D6] transition-colors">
                {icon}
              </span>
            )}
            <Link
              href={`/methodology${methodologyAnchor}`}
              className="text-[#5B6573] hover:text-[#2457D6] transition-colors p-0.5 rounded focus:ring-1 focus:ring-[#2457D6]"
              title={`${definition} (Click to inspect counting methodology)`}
              aria-label={`Methodology definition for ${label}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="my-1.5">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17212F] tabular-nums">
            {value}
          </div>
        </div>
      </div>

      <div>
        {subtext && (
          <p className="text-[11px] text-[#5B6573] border-t border-[#E1E5EB]/60 pt-2.5 mt-2 leading-relaxed">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
