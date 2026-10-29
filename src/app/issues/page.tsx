"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Filter, Shield, ArrowRight, AlertCircle } from "lucide-react";
import IssueCard from "@/components/ui/IssueCard";

interface IssueItem {
  id: string;
  slug: string;
  companyId: string;
  category: string;
  title: string;
  description: string;
  publicationStatus: string;
  publishedAt: string;
  totalReports: number;
  uniqueReporters: number;
  evidenceBackedReports: number;
  reportedResolved?: number;
  activeCampaignsCount: number;
  updatesCount: number;
  latestReportAt?: string | null;
}

function IssuesDirectoryContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialQuery = searchParams.get("q") || "";

  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "monitored">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssues() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (categoryFilter !== "all") params.set("category", categoryFilter);
        if (searchQuery) params.set("q", searchQuery);

        const res = await fetch(`/api/v1/issues?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setIssues(data.issues || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    const debounce = setTimeout(fetchIssues, 200);
    return () => clearTimeout(debounce);
  }, [categoryFilter, searchQuery]);

  // Client-side status filtering
  const filteredIssues = issues.filter((issue) => {
    if (statusFilter === "active") return issue.totalReports > 0;
    if (statusFilter === "monitored") return issue.totalReports === 0;
    return true;
  });

  const activeCount = issues.filter((i) => i.totalReports > 0).length;
  const monitoredCount = issues.filter((i) => i.totalReports === 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>Factual Consumer Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17212F]">
          Explore Consumer Grievance Issues
        </h1>
        <p className="text-sm sm:text-base text-[#5B6573] max-w-2xl leading-relaxed">
          Aggregated, evidence-backed registry tracking retail delivery defects and fulfillment delays reported
          by consumers across India.
        </p>
      </div>

      {/* Discovery & Search Bar */}
      <div className="space-y-4 bg-white p-5 sm:p-6 rounded-2xl border border-[#E1E5EB] shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#5B6573]" />
            <input
              type="text"
              placeholder="Search by keywords, courier delay, or issue title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#17212F] focus:bg-white focus:border-[#2457D6] focus:outline-none transition-all shadow-xs"
            />
          </div>

          {/* Status Tabs (All / Active Reports / Monitored Scopes) */}
          <div className="inline-flex rounded-xl border border-[#E1E5EB] p-1 bg-[#F7F8FA] text-xs font-semibold self-start md:self-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-white text-[#17212F] shadow-xs"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              All Scopes ({issues.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "active"
                  ? "bg-white text-[#2457D6] shadow-xs font-bold"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              Active Reports ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("monitored")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === "monitored"
                  ? "bg-white text-[#087E8B] shadow-xs font-bold"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              Zero Reports ({monitoredCount})
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[#E1E5EB] pb-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-[#5B6573] shrink-0" />
          {[
            { id: "all", label: "All Categories" },
            { id: "delayed_delivery", label: "Delayed Delivery" },
            { id: "tracking_stalled", label: "Tracking Stalled" },
            { id: "no_support", label: "Unresponsive Support" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors ${
                categoryFilter === cat.id
                  ? "bg-[#2457D6] text-white border-[#2457D6] font-semibold"
                  : "bg-white text-[#5B6573] border-[#E1E5EB] hover:bg-[#F7F8FA]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs animate-pulse h-64 space-y-3"
            >
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
              <div className="h-12 w-full bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1E5EB] bg-white p-12 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-[#5B6573] mx-auto opacity-40" />
          <h3 className="text-base font-bold text-[#17212F]">No matching consumer issues found</h3>
          <p className="text-xs text-[#5B6573] max-w-sm mx-auto">
            Try adjusting your search keywords or switching category filters.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setStatusFilter("all");
              }}
              className="px-4 py-2 rounded-xl bg-[#F7F8FA] border border-[#E1E5EB] text-xs font-semibold text-[#17212F] hover:bg-[#EAECEF]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              id={issue.id}
              slug={issue.slug}
              companyId={issue.companyId}
              category={issue.category}
              title={issue.title}
              description={issue.description}
              totalReports={issue.totalReports}
              uniqueReporters={issue.uniqueReporters}
              evidenceBackedReports={issue.evidenceBackedReports}
              reportedResolved={issue.reportedResolved || 0}
              latestReportAt={issue.latestReportAt}
            />
          ))}
        </div>
      )}

      {/* Unlisted Issue Prompt */}
      <div className="rounded-2xl border border-[#2457D6]/20 bg-[#EFF4FF] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#17212F]">
            Experiencing a delivery failure not listed here?
          </h3>
          <p className="text-xs text-[#5B6573] max-w-xl">
            You can document any Flipkart e-commerce delivery grievance with your order reference and tracking SLA proof.
          </p>
        </div>
        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] transition-colors shrink-0"
        >
          <span>Submit a Report</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function IssuesDirectoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
          Loading issue directory...
        </div>
      }
    >
      <IssuesDirectoryContent />
    </Suspense>
  );
}
