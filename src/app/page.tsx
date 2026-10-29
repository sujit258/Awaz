"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import TrendChart from "@/components/ui/TrendChart";
import IssueCard from "@/components/ui/IssueCard";
import { DailyTrendPoint, AggregateStats } from "@/lib/aggregation/counting";
import { formatDistanceToNow } from "date-fns";

interface TrendingIssue {
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
  updatedAt: string;
}

interface TimelineUpdate {
  id: string;
  updateType: string;
  publicContent: string;
  publishedAt: string;
  issue: {
    id: string;
    slug: string;
    title: string;
    companyId: string;
  };
}

export default function HomePage() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<7 | 30>(30);
  const [trendingIssues, setTrendingIssues] = useState<TrendingIssue[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<TimelineUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch(`/api/v1/dashboard?range=${trendRange}`);
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const data = await res.json();
        if (active) {
          setStats(data.stats);
          setTrends(data.trends || []);
          setTrendingIssues(data.trendingIssues || []);
          setLatestUpdates(data.latestUpdates || []);
        }
      } catch (err: unknown) {
        console.error(err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [trendRange]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#E1E5EB] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E] mb-4 border border-[#18794E]/20">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Independent Consumer Collective Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#17212F] leading-tight">
              Customer issues deserve visibility.
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#5B6573] leading-relaxed">
              Report your experience, discover shared problems and help build a clearer, evidence-backed
              picture of customer service. Isolated complaints become actionable collective insight.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] transition-colors focus:ring-2 focus:ring-[#2457D6] focus:ring-offset-2"
              >
                <span>Report an Issue</span>
                <ChevronRight className="h-4 w-4" />
              </Link>

              <Link
                href="/issues"
                className="inline-flex items-center gap-2 rounded-lg border border-[#E1E5EB] bg-white px-5 py-3 text-sm font-semibold text-[#17212F] shadow-xs hover:bg-[#F7F8FA] hover:border-[#CBD2DC] transition-colors"
              >
                <span>Explore Reported Issues</span>
                <ArrowRight className="h-4 w-4 text-[#5B6573]" />
              </Link>
            </div>

            {/* Independence Note */}
            <p className="mt-6 text-xs text-[#5B6573] leading-normal flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-[#087E8B] shrink-0" />
              <span>
                Awaz is an independent public-interest platform. Displayed figures reflect voluntary customer reports, not official company-wide statistics.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Main Statistics Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        <section aria-labelledby="stats-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="stats-heading" className="text-lg font-bold text-[#17212F]">
                Verified Aggregate Metrics
              </h2>
              <p className="text-xs text-[#5B6573]">
                Strictly deduplicated reports adhering to the Awaz Public Evidence Standard
              </p>
            </div>
            <Link
              href="/methodology"
              className="text-xs font-semibold text-[#2457D6] hover:text-[#1B44AA] flex items-center gap-1"
            >
              <span>How we count</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Eligible Reports"
              value={stats ? stats.totalReports : "0"}
              definition="Total complaint reports meeting eligibility criteria, excluding rejected or spam submissions."
              subtext="Excludes rejected and duplicate reports"
              methodologyAnchor="#eligible-reports"
              icon={<FileText className="h-4 w-4" />}
              loading={loading}
            />

            <StatCard
              label="Unique Reporters"
              value={stats ? stats.uniqueReporters : "0"}
              definition="Distinct verified customer accounts submitting complaints. Multiple submissions by one customer count once."
              subtext="Distinct individuals affected"
              methodologyAnchor="#unique-reporters"
              icon={<Users className="h-4 w-4" />}
              loading={loading}
            />

            <StatCard
              label="Evidence-Backed"
              value={stats ? stats.evidenceBackedReports : "0"}
              definition="Complaints supported by invoices, delivery status logs, or customer support transcripts."
              subtext={
                stats && stats.totalReports > 0
                  ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}% of total complaints`
                  : "Private by default"
              }
              methodologyAnchor="#evidence-criteria"
              icon={<ShieldCheck className="h-4 w-4 text-[#087E8B]" />}
              loading={loading}
            />

            <StatCard
              label="Reported Resolutions"
              value={stats ? stats.reportedResolutions : "0"}
              definition="Complaints where the reporting customer explicitly confirmed fulfillment, delivery, or dispute settlement."
              subtext={
                stats && stats.totalReports > 0
                  ? `${stats.resolutionRatePct}% customer-confirmed rate`
                  : "Confirmed by reporter"
              }
              methodologyAnchor="#resolutions"
              icon={<CheckCircle2 className="h-4 w-4 text-[#18794E]" />}
              loading={loading}
            />
          </div>
        </section>

        {/* Trends Section */}
        <section aria-labelledby="trends-heading">
          <TrendChart
            trends={trends}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
            loading={loading}
          />
        </section>

        {/* Trending Issues Section */}
        <section aria-labelledby="issues-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="issues-heading" className="text-lg font-bold text-[#17212F] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#2457D6]" />
                Active Complaint Categories
              </h2>
              <p className="text-xs text-[#5B6573]">
                Categorized consumer issues under active documentation for Flipkart in India
              </p>
            </div>
            <Link
              href="/issues"
              className="text-xs font-semibold text-[#2457D6] hover:text-[#1B44AA] flex items-center gap-1"
            >
              <span>View all issues</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {trendingIssues.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-white p-8 text-center text-sm text-[#5B6573]">
              No active issue categories recorded. Check back shortly.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trendingIssues.map((issue) => (
                <IssueCard key={issue.id} {...issue} />
              ))}
            </div>
          )}
        </section>

        {/* Latest Public Timeline Updates */}
        <section aria-labelledby="updates-heading">
          <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="updates-heading" className="text-base font-bold text-[#17212F] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#087E8B]" />
                  Latest Public Progress & Timeline Updates
                </h2>
                <p className="text-xs text-[#5B6573]">
                  Moderator-approved updates and collective action milestones (no private complaint descriptions)
                </p>
              </div>
            </div>

            {latestUpdates.length === 0 ? (
              <p className="text-xs text-[#5B6573] py-4">No recent public updates published.</p>
            ) : (
              <div className="divide-y divide-[#E1E5EB]">
                {latestUpdates.map((update) => (
                  <div key={update.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                          {update.updateType}
                        </span>
                        <Link
                          href={`/issues/${update.issue.slug}`}
                          className="text-xs font-semibold text-[#2457D6] hover:underline"
                        >
                          {update.issue.title}
                        </Link>
                      </div>
                      <p className="text-xs text-[#17212F] leading-relaxed max-w-3xl">
                        {update.publicContent}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#5B6573] shrink-0">
                      {formatDistanceToNow(new Date(update.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust, Privacy & Methodology Explainer */}
        <section className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-6 sm:p-8">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-xl font-bold text-[#17212F]">
              How Awaz Maintains Trust & Accuracy
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5B6573] leading-relaxed">
              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Evidence Over Outrage</h3>
                <p>
                  Every reported complaint requires structured order timelines and optional verified invoices or courier tracking screenshots. We avoid inflammatory or sensational rhetoric.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Privacy by Default</h3>
                <p>
                  Order numbers, full names, home addresses, phone numbers, and raw evidence files are strictly confidential and never exposed in public feeds.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Independent Deduplication</h3>
                <p>
                  We track unique reporters separately from submission counts and apply algorithmic duplicate detection to prevent spam or artificial inflation.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Right of Reply & Dispute</h3>
                <p>
                  Companies and consumers can review published methodology and request corrections if factual anomalies or verified redressals occur.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
              <Link href="/methodology" className="text-[#2457D6] hover:underline flex items-center gap-1">
                <span>Read Full Methodology</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link href="/about" className="text-[#5B6573] hover:text-[#17212F]">
                Our Independence Charter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
