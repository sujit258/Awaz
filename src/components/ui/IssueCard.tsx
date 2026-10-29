import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Users, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IssueCardProps {
  id: string;
  slug: string;
  companyId: string;
  category: string;
  title: string;
  description: string;
  totalReports: number;
  uniqueReporters: number;
  evidenceBackedReports: number;
  reportedResolved: number;
  updatedAt?: Date | string;
}

const CATEGORY_NAMES: Record<string, string> = {
  delayed_delivery: "Delayed Delivery",
  tracking_stalled: "Tracking Stalled",
  no_support: "Unresponsive Support",
  other: "Delivery Issue",
};

export default function IssueCard({
  slug,
  companyId,
  category,
  title,
  description,
  totalReports,
  uniqueReporters,
  evidenceBackedReports,
  reportedResolved,
  updatedAt,
}: IssueCardProps) {
  const evidencePct =
    totalReports > 0 ? Math.round((evidenceBackedReports / totalReports) * 100) : 0;

  const categoryLabel = CATEGORY_NAMES[category] || category;

  return (
    <div className="group rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs hover:border-[#2457D6] hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#F7F8FA] px-2 py-0.5 text-xs font-semibold text-[#172B4D] border border-[#E1E5EB] uppercase tracking-wider">
              {companyId}
            </span>
            <span className="inline-flex items-center rounded-md bg-[#EDF7F1] px-2 py-0.5 text-xs font-medium text-[#18794E]">
              {categoryLabel}
            </span>
          </div>
          {updatedAt && (
            <span className="text-[11px] text-[#5B6573]">
              Active {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-[#17212F] group-hover:text-[#2457D6] transition-colors leading-snug">
          <Link href={`/issues/${slug}`} className="focus:outline-none">
            {title}
          </Link>
        </h4>

        {/* Neutral summary */}
        <p className="mt-2 text-xs text-[#5B6573] line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Statistics Strip */}
      <div className="mt-5 pt-4 border-t border-[#E1E5EB]">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-[#F7F8FA] p-2">
            <span className="text-[10px] text-[#5B6573] flex items-center justify-center gap-1 mb-0.5">
              <FileText className="h-3 w-3 text-[#5B6573]" />
              Reports
            </span>
            <span className="font-bold text-[#17212F] tabular-nums text-sm">
              {totalReports}
            </span>
          </div>

          <div className="rounded bg-[#F7F8FA] p-2">
            <span className="text-[10px] text-[#5B6573] flex items-center justify-center gap-1 mb-0.5">
              <Users className="h-3 w-3 text-[#5B6573]" />
              Reporters
            </span>
            <span className="font-bold text-[#17212F] tabular-nums text-sm">
              {uniqueReporters}
            </span>
          </div>

          <div className="rounded bg-[#F7F8FA] p-2">
            <span className="text-[10px] text-[#5B6573] flex items-center justify-center gap-1 mb-0.5">
              <ShieldCheck className="h-3 w-3 text-[#087E8B]" />
              Verified
            </span>
            <span className="font-bold text-[#087E8B] tabular-nums text-sm">
              {evidencePct}%
            </span>
          </div>
        </div>

        {/* Card CTA */}
        <div className="mt-3 flex items-center justify-between text-xs pt-1">
          <span className="text-[#5B6573]">
            {reportedResolved} confirmed resolution{reportedResolved !== 1 ? "s" : ""}
          </span>
          <Link
            href={`/issues/${slug}`}
            className="inline-flex items-center gap-1 font-semibold text-[#2457D6] group-hover:translate-x-0.5 transition-transform"
          >
            <span>View evidence & data</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
