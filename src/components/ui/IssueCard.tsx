import Link from "next/link";
import { ArrowUpRight, ArrowRight, Users, FileText, FileCheck, CheckCircle2 } from "lucide-react";
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
  other: "Fulfillment Grievance",
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
  const categoryLabel = CATEGORY_NAMES[category] || category.replace("_", " ");
  const isZeroState = totalReports === 0;

  return (
    <div
      className={`group rounded-2xl border bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
        isZeroState
          ? "border-[#E1E5EB] hover:border-[#CBD2DC]"
          : "border-[#E1E5EB] hover:border-[#2457D6]/60"
      }`}
    >
      <div>
        {/* Category & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center rounded-md bg-[#F7F8FA] px-2 py-0.5 text-[10px] font-bold text-[#172B4D] border border-[#E1E5EB] uppercase tracking-wider">
              {companyId}
            </span>
            <span className="inline-flex items-center rounded-md bg-[#EDF7F1] px-2 py-0.5 text-[11px] font-semibold text-[#18794E]">
              {categoryLabel}
            </span>
          </div>

          <div className="text-[11px] text-[#5B6573]">
            {latestReportAt ? (
              <span className="inline-flex items-center gap-1 font-medium text-[#18794E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#18794E]"></span>
                Reported {formatDistanceToNow(new Date(latestReportAt), { addSuffix: true })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#5B6573]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#CBD2DC]"></span>
                Zero reports logged
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#17212F] group-hover:text-[#2457D6] transition-colors leading-snug">
          <Link href={`/issues/${slug}`} className="focus:outline-none">
            {title}
          </Link>
        </h3>

        {/* Neutral summary */}
        <p className="mt-2 text-xs text-[#5B6573] line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Statistics or Respectful Monitored State */}
      <div className="mt-6 pt-4 border-t border-[#E1E5EB]">
        {isZeroState ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-[#F7F8FA] p-3 text-center text-xs text-[#5B6573] border border-[#E1E5EB]/60">
              <span className="font-semibold text-[#17212F] block text-xs mb-0.5">
                0 public reports logged
              </span>
              <span className="text-[11px]">
                Predefined category under active monitoring across India.
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link
                href={`/report?issue=${id}`}
                className="inline-flex items-center gap-1 font-semibold text-[#2457D6] hover:text-[#1B44AA] transition-colors"
              >
                <span>Be the first to document</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href={`/issues/${slug}`}
                className="text-xs text-[#5B6573] hover:text-[#17212F] font-medium"
              >
                View scope
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#F7F8FA] p-2 border border-[#E1E5EB]/50">
                <span className="text-[10px] text-[#5B6573] font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <FileText className="h-3 w-3 text-[#5B6573]" />
                  Reports
                </span>
                <span className="font-extrabold text-[#17212F] tabular-nums text-sm">
                  {totalReports}
                </span>
              </div>

              <div className="rounded-lg bg-[#F7F8FA] p-2 border border-[#E1E5EB]/50">
                <span className="text-[10px] text-[#5B6573] font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <Users className="h-3 w-3 text-[#5B6573]" />
                  Reporters
                </span>
                <span className="font-extrabold text-[#17212F] tabular-nums text-sm">
                  {uniqueReporters}
                </span>
              </div>

              <div className="rounded-lg bg-[#F7F8FA] p-2 border border-[#E1E5EB]/50" title="Voluntary screenshots, invoices, and delivery logs">
                <span className="text-[10px] text-[#087E8B] font-semibold flex items-center justify-center gap-1 mb-0.5">
                  <FileCheck className="h-3 w-3" />
                  Evidence
                </span>
                <span className="font-extrabold text-[#087E8B] tabular-nums text-sm">
                  {evidenceBackedReports}
                </span>
              </div>
            </div>

            {/* Resolution indicator & Action */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-[#5B6573] inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-[#18794E]" />
                {reportedResolved} customer resolution{reportedResolved !== 1 ? "s" : ""}
              </span>
              <Link
                href={`/issues/${slug}`}
                className="inline-flex items-center gap-1 font-bold text-[#2457D6] group-hover:translate-x-0.5 transition-transform"
              >
                <span>Inspect Evidence</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
