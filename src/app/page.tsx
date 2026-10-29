"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Clock,
  Layers,
  Search,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import TrendChart from "@/components/ui/TrendChart";
import IssueCard from "@/components/ui/IssueCard";
import { DailyTrendPoint, AggregateStats } from "@/lib/aggregation/counting";
import { formatDistanceToNow } from "date-fns";

interface TrackedIssue {
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
  const router = useRouter();
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<7 | 30>(30);
  const [activeReportedIssues, setActiveReportedIssues] = useState<TrackedIssue[]>([]);
  const [trackedCategories, setTrackedCategories] = useState<TrackedIssue[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<TimelineUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickSearch, setQuickSearch] = useState("");

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
          setActiveReportedIssues(data.activeReportedIssues || []);
          setTrackedCategories(data.trackedCategories || data.trendingIssues || []);
          setLatestUpdates(data.latestUpdates || []);
        }
      } catch (err: unknown) {
        console.error("Dashboard data load error:", err);
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (quickSearch.trim()) {
      router.push(`/issues?q=${encodeURIComponent(quickSearch.trim())}`);
    } else {
      router.push("/issues");
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* Editorial High-Impact Hero */}
      <section className="relative overflow-hidden bg-white border-b border-[#E1E5EB] pt-12 pb-14 sm:pt-16 sm:pb-20">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none"></div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-5">
            {/* Live Platform Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3.5 py-1 text-xs font-semibold text-[#18794E] shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#18794E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#18794E]"></span>
              </span>
              <span>Independent Public Consumer Evidence Registry</span>
            </div>

            {/* Headline */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#2457D6] mb-2">
                One issue. Many voices. Visible evidence.
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#17212F] leading-[1.12]">
                Turn retail delivery delays into{" "}
                <span className="text-[#2457D6] underline decoration-[#2457D6]/20 underline-offset-4">
                  verified public evidence
                </span>
                .
              </h1>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-[#5B6573] leading-relaxed max-w-2xl">
              Awaz aggregates isolated e-commerce fulfillment failures into credible, customer-backed evidence
              records across India. Explore systemic patterns or document your own experience with proof.
            </p>

            {/* Quick Interactive Search & Discovery Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#5B6573]" />
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    placeholder="Search issues (e.g. delayed delivery, tracking stalled, refunds)..."
                    className="w-full rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#17212F] focus:bg-white focus:border-[#2457D6] focus:outline-none transition-all shadow-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#17212F] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#2457D6] transition-colors shrink-0"
                >
                  Search Registry
                </button>
              </div>

              {/* Fast Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-3 text-xs text-[#5B6573]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5B6573]">Quick Jump:</span>
                <Link
                  href="/issues?category=delayed_delivery"
                  className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] hover:bg-[#EFF4FF] hover:text-[#2457D6] border border-[#E1E5EB] transition-colors font-medium text-[11px]"
                >
                  Delayed Delivery
                </Link>
                <Link
                  href="/issues?category=tracking_stalled"
                  className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] hover:bg-[#EFF4FF] hover:text-[#2457D6] border border-[#E1E5EB] transition-colors font-medium text-[11px]"
                >
                  Tracking Stalled
                </Link>
                <Link
                  href="/issues?category=no_support"
                  className="px-2.5 py-1 rounded-lg bg-[#F7F8FA] hover:bg-[#EFF4FF] hover:text-[#2457D6] border border-[#E1E5EB] transition-colors font-medium text-[11px]"
                >
                  Support Unresponsive
                </Link>
              </div>
            </form>

            {/* Primary Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/report"
                className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#1B44AA] transition-all hover:shadow-md focus:ring-2 focus:ring-[#2457D6] focus:ring-offset-2"
              >
                <span>Report an Issue</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/issues"
                className="inline-flex items-center gap-2 rounded-xl border border-[#E1E5EB] bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#17212F] shadow-2xs hover:bg-[#F7F8FA] hover:border-[#CBD2DC] transition-all"
              >
                <span>Explore Tracked Issues</span>
              </Link>

              <Link
                href="/track"
                className="text-xs sm:text-sm font-semibold text-[#5B6573] hover:text-[#2457D6] px-3 py-2 transition-colors"
              >
                Track Existing Report →
              </Link>
            </div>

            {/* Non-Governmental Independence Banner */}
            <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-xs text-[#5B6573] flex items-start gap-2.5 max-w-2xl">
              <AlertCircle className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
              <span>
                <strong>Independence Notice: </strong> Awaz is an independent public-interest platform. We are not a government agency, court, or corporate representative. Figures reflect voluntary customer submissions verified under our public standard.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Platform Evidence Telemetry Grid */}
        <section aria-labelledby="metrics-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="metrics-heading" className="text-lg font-bold text-[#17212F]">
                Verified Platform Telemetry
              </h2>
              <p className="text-xs text-[#5B6573]">
                Strictly deduplicated genuine consumer grievance data. Zero synthetic or demo numbers.
              </p>
            </div>
            <Link
              href="/methodology"
              className="text-xs font-bold text-[#2457D6] hover:text-[#1B44AA] flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Inspect counting standard</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Eligible Reports"
              value={stats ? stats.totalReports : "0"}
              definition="Verified complaint submissions meeting truthfulness and fulfillment SLA criteria, excluding spam and duplicate records."
              subtext="Factual consumer grievance records"
              methodologyAnchor="#eligible-reports"
              icon={<FileText className="h-4 w-4" />}
              loading={loading}
              accentColor="blue"
            />

            <StatCard
              label="Unique Reporters"
              value={stats ? stats.uniqueReporters : "0"}
              definition="Distinct registered user accounts and anonymous filing citizens. Multiple submissions by one customer count as 1 unique reporter."
              subtext="Independent individuals affected"
              methodologyAnchor="#unique-reporters"
              icon={<Users className="h-4 w-4" />}
              loading={loading}
              accentColor="teal"
            />

            <StatCard
              label="Evidence Submitted"
              value={stats ? stats.evidenceBackedReports : "0"}
              definition="Submissions where the consumer voluntarily attached order tracking screenshots, receipts, or courier correspondence."
              subtext={
                stats && stats.totalReports > 0
                  ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}% of reported cases`
                  : "Private & optional"
              }
              methodologyAnchor="#evidence-criteria"
              icon={<ShieldCheck className="h-4 w-4 text-[#087E8B]" />}
              loading={loading}
              accentColor="teal"
            />

            <StatCard
              label="Reported Resolutions"
              value={stats ? stats.reportedResolutions : "0"}
              definition="Complaints where the reporting customer explicitly confirmed package delivery, replacement, or dispute settlement."
              subtext={
                stats && stats.totalReports > 0
                  ? `${stats.resolutionRatePct}% confirmed by customer`
                  : "Confirmed by reporter"
              }
              methodologyAnchor="#resolutions"
              icon={<CheckCircle2 className="h-4 w-4 text-[#18794E]" />}
              loading={loading}
              accentColor="green"
            />
          </div>
        </section>

        {/* Adaptive Visualizations Hub */}
        <section aria-labelledby="telemetry-chart">
          <TrendChart
            trends={trends}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
            loading={loading}
          />
        </section>

        {/* SECTION: Active Reported Issues (If any reports exist) */}
        {activeReportedIssues.length > 0 && (
          <section aria-labelledby="active-grievances-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="active-grievances-heading" className="text-lg font-bold text-[#17212F] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#2457D6]" />
                  Active Consumer Grievance Records
                </h2>
                <p className="text-xs text-[#5B6573]">
                  Issues with at least one active, verified customer submission
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeReportedIssues.map((issue) => (
                <IssueCard key={issue.id} {...issue} />
              ))}
            </div>
          </section>
        )}

        {/* SECTION: Monitored Categories */}
        <section aria-labelledby="monitored-categories-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="monitored-categories-heading" className="text-lg font-bold text-[#17212F] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#087E8B]" />
                Monitored Scopes &amp; Categories
              </h2>
              <p className="text-xs text-[#5B6573]">
                Factual grievance categories established for e-commerce in India. Explore scopes or be the first to report.
              </p>
            </div>
            <Link
              href="/issues"
              className="text-xs font-bold text-[#2457D6] hover:text-[#1B44AA] flex items-center gap-1"
            >
              <span>Explore all scopes</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {trackedCategories.length === 0 && !loading ? (
            <div className="rounded-2xl border border-dashed border-[#E1E5EB] bg-white p-8 text-center text-sm text-[#5B6573]">
              No issue categories established.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {trackedCategories.map((issue) => (
                <IssueCard key={issue.id} {...issue} />
              ))}
            </div>
          )}
        </section>

        {/* Public Timeline Updates */}
        <section aria-labelledby="timeline-heading">
          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="timeline-heading" className="text-base font-bold text-[#17212F] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#087E8B]" />
                  Public Progress &amp; Milestone History
                </h2>
                <p className="text-xs text-[#5B6573]">
                  Platform timeline milestones and verified company communication (no private complaint text)
                </p>
              </div>
            </div>

            {latestUpdates.length === 0 ? (
              <p className="text-xs text-[#5B6573] py-4 text-center">
                No public timeline milestones published yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E1E5EB]">
                {latestUpdates.map((update) => (
                  <div key={update.id} className="py-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                          {update.updateType.replace("_", " ")}
                        </span>
                        <Link
                          href={`/issues/${update.issue.slug}`}
                          className="text-xs font-bold text-[#2457D6] hover:underline"
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
      </div>
    </div>
  );
}
