import Link from "next/link";
import { ArrowUpRight, ArrowRight, Users, FileText, FileCheck } from "lucide-react";
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
  latestReportAt?: string | null;
  updatedAt?: Date | string;
}

const CATEGORY_NAMES: Record<string, string> = {
  delayed_delivery: "Delayed Delivery",
  tracking_stalled: "Tracking Stalled",
  no_support: "Unresponsive Support",
  other: "Delivery Issue",
};

export default function IssueCard({
  id,
  slug,
  companyId,
  category,
  title,
  description,
  totalReports,
  uniqueReporters,
  evidenceBackedReports,
  reportedResolved,
  latestReportAt,
}: IssueCardProps) {
  const categoryLabel = CATEGORY_NAMES[category] || category;
  const isZeroState = totalReports === 0;

  return (
    <div className="group rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs hover:border-[#2457D6] hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Badges & Real Activity Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#F7F8FA] px-2 py-0.5 text-xs font-semibold text-[#172B4D] border border-[#E1E5EB] uppercase tracking-wider">
              {companyId}
            </span>
            <span className="inline-flex items-center rounded-md bg-[#EDF7F1] px-2 py-0.5 text-xs font-medium text-[#18794E]">
              {categoryLabel}
            </span>
          </div>

          <span className="text-[11px] text-[#5B6573]">
            {latestReportAt
              ? `Latest report ${formatDistanceToNow(new Date(latestReportAt), { addSuffix: true })}`
              : "No reports yet"}
          </span>
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

      {/* Honest Statistics or Respectful Zero State */}
      <div className="mt-5 pt-4 border-t border-[#E1E5EB]">
        {isZeroState ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-[#F7F8FA] p-3 text-center text-xs text-[#5B6573]">
              <span className="font-semibold text-[#17212F] block mb-0.5">
                0 public reports recorded
              </span>
              <span className="text-[11px]">
                Predefined category under active monitoring.
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link
                href={`/report?issue=${id}`}
                className="inline-flex items-center gap-1 font-semibold text-[#2457D6] hover:text-[#1B44AA]"
              >
                <span>Be the first to report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/issues/${slug}`}
                className="text-xs text-[#5B6573] hover:text-[#17212F]"
              >
                View scope
              </Link>
            </div>
          </div>
        ) : (
          <div>
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
                <span className="text-[10px] text-[#5B6573] flex items-center justify-center gap-1 mb-0.5" title="Reports with attached invoices, screenshots, or delivery logs">
                  <FileCheck className="h-3 w-3 text-[#087E8B]" />
                  Evidence
                </span>
                <span className="font-bold text-[#087E8B] tabular-nums text-sm">
                  {evidenceBackedReports}
                </span>
              </div>
            </div>

            {/* Card CTA */}
            <div className="mt-3 flex items-center justify-between text-xs pt-1">
              <span className="text-[#5B6573]">
                {reportedResolved} resolution{reportedResolved !== 1 ? "s" : ""} confirmed by customer
              </span>
              <Link
                href={`/issues/${slug}`}
                className="inline-flex items-center gap-1 font-semibold text-[#2457D6] group-hover:translate-x-0.5 transition-transform"
              >
                <span>View evidence</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
