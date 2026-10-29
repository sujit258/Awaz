"use client";

import { useEffect, useState } from "react";
import { Search, Filter, Shield } from "lucide-react";
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

export default function IssuesDirectoryPage() {
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E] mb-3">
          <Shield className="h-3.5 w-3.5" />
          <span>Public Issue Registry</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#17212F]">
          Explore Consumer Grievance Issues
        </h1>
        <p className="mt-2 text-sm text-[#5B6573] max-w-2xl leading-relaxed">
          Aggregated, evidence-backed issue pages tracking systemic delivery and fulfillment
          defects reported by consumers across India.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E1E5EB] shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
          <input
            type="text"
            placeholder="Search issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] pl-9 pr-3.5 py-1.5 text-xs text-[#17212F] focus:bg-white focus:border-[#2457D6]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
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
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-colors ${
                categoryFilter === cat.id
                  ? "bg-[#2457D6] text-white border-[#2457D6]"
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
            <div key={n} className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs animate-pulse h-64">
              <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
              <div className="h-12 w-full bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-white p-12 text-center text-sm text-[#5B6573]">
          No matching consumer issues found. Try refining your search query or filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
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
    </div>
  );
}
