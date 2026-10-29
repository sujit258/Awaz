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
  Shield,
  Layers,
  Search,
  Lock,
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
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<7 | 30>(30);
  const [activeReportedIssues, setActiveReportedIssues] = useState<TrackedIssue[]>([]);
  const [trackedCategories, setTrackedCategories] = useState<TrackedIssue[]>([]);
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

  const hasNoReports = stats ? stats.totalReports === 0 : false;

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="bg-white border-b border-[#E1E5EB] py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E] mb-4 border border-[#18794E]/20">
              <Shield className="h-3.5 w-3.5" />
              <span>Independent Public Consumer Evidence Platform</span>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#2457D6] mb-2">
              One issue. Many voices. Visible evidence.
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#17212F] leading-tight">
              Independent Consumer Issue Tracker
            </h1>

            <p className="mt-4 text-base sm:text-lg text-[#5B6573] leading-relaxed">
              Report your retail delivery grievance, explore shared patterns, and follow publicly documented
              resolution progress. Awaz turns isolated complaints into credible, aggregated public evidence.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
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
                <Search className="h-4 w-4 text-[#5B6573]" />
                <span>Explore Issues We Track</span>
              </Link>

              <Link
                href="/track"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5B6573] hover:text-[#2457D6] px-3 py-2"
              >
                <span>Track Existing Report</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Non-Governmental Independence Disclaimer */}
            <div className="mt-6 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-xs text-[#5B6573] flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
              <span>
                <strong>Independence Notice: </strong> Awaz is an independent public-interest platform. We are not a government portal, court, regulator, or corporate representative. Displayed figures reflect voluntary customer reports, not official company-wide totals.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Platform Metrics */}
        <section aria-labelledby="stats-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="stats-heading" className="text-lg font-bold text-[#17212F]">
                Platform Evidence Metrics
              </h2>
              <p className="text-xs text-[#5B6573]">
                Strictly deduplicated, genuine customer submissions. No synthetic or demo records.
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
              definition="Total customer submissions meeting truthfulness criteria, excluding spam, duplicate, and withdrawn reports."
              subtext="Real consumer grievance records"
              methodologyAnchor="#eligible-reports"
              icon={<FileText className="h-4 w-4" />}
              loading={loading}
            />

            <StatCard
              label="Unique Reporters"
              value={stats ? stats.uniqueReporters : "0"}
              definition="Distinct registered user accounts and anonymous filing consumers. Multiple submissions by one customer count once."
              subtext="Distinct individuals affected"
              methodologyAnchor="#unique-reporters"
              icon={<Users className="h-4 w-4" />}
              loading={loading}
            />

            <StatCard
              label="Evidence Submitted"
              value={stats ? stats.evidenceBackedReports : "0"}
              definition="Reports where the consumer voluntarily attached tracking screenshots, receipts, or courier correspondence."
              subtext={
                stats && stats.totalReports > 0
                  ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}% of reported cases`
                  : "Private & optional"
              }
              methodologyAnchor="#evidence-criteria"
              icon={<ShieldCheck className="h-4 w-4 text-[#087E8B]" />}
              loading={loading}
            />

            <StatCard
              label="Reported Resolutions"
              value={stats ? stats.reportedResolutions : "0"}
              definition="Complaints where the reporting customer explicitly confirmed delivery fulfillment, replacement, or dispute settlement."
              subtext={
                stats && stats.totalReports > 0
                  ? `${stats.resolutionRatePct}% confirmed by customer`
                  : "Confirmed by reporter"
              }
              methodologyAnchor="#resolutions"
              icon={<CheckCircle2 className="h-4 w-4 text-[#18794E]" />}
              loading={loading}
            />
          </div>
        </section>

        {/* Honest Launch State Banner (Shown when total reports is 0) */}
        {hasNoReports && !loading && (
          <div className="rounded-xl border border-[#2457D6]/20 bg-[#EFF4FF] p-6 text-center space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2457D6] shadow-xs">
              <Shield className="h-3.5 w-3.5" />
              <span>Public Beta Launch Notice</span>
            </div>
            <h3 className="text-base font-bold text-[#17212F]">
              Awaz is collecting its initial consumer grievance reports
            </h3>
            <p className="text-xs text-[#5B6573] max-w-xl mx-auto leading-relaxed">
              To uphold absolute truthfulness, Awaz does not seed synthetic complaint numbers, artificial trends, or placeholder engagement. Predefined categories are open for documentation below.
            </p>
            <div className="pt-2">
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA] transition-colors"
              >
                <span>Submit the First Report</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Trends Section */}
        <section aria-labelledby="trends-heading">
          <TrendChart
            trends={trends}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
            loading={loading}
          />
        </section>

        {/* SECTION A: Currently Reported Issues (Only if reports exist) */}
        {activeReportedIssues.length > 0 && (
          <section aria-labelledby="active-issues-heading">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="active-issues-heading" className="text-lg font-bold text-[#17212F] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#2457D6]" />
                  Currently Reported Issues
                </h2>
                <p className="text-xs text-[#5B6573]">
                  Issue categories with at least one active, eligible customer submission
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

        {/* SECTION B: Issues We Track (Predefined Categories with Honest Zero States) */}
        <section aria-labelledby="tracked-issues-heading">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="tracked-issues-heading" className="text-lg font-bold text-[#17212F] flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#087E8B]" />
                Issues We Track (Predefined Categories)
              </h2>
              <p className="text-xs text-[#5B6573]">
                Factual grievance categories established for Flipkart in India. Explore scopes or be the first to report.
              </p>
            </div>
            <Link
              href="/issues"
              className="text-xs font-semibold text-[#2457D6] hover:text-[#1B44AA] flex items-center gap-1"
            >
              <span>View all categories</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {trackedCategories.length === 0 && !loading ? (
            <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-white p-8 text-center text-sm text-[#5B6573]">
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

        {/* Latest Public Timeline Updates */}
        <section aria-labelledby="updates-heading">
          <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="updates-heading" className="text-base font-bold text-[#17212F] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#087E8B]" />
                  Public Progress &amp; Documentation Updates
                </h2>
                <p className="text-xs text-[#5B6573]">
                  Platform timeline milestones and verified company communication (no private complaint descriptions)
                </p>
              </div>
            </div>

            {latestUpdates.length === 0 ? (
              <p className="text-xs text-[#5B6573] py-4 text-center">
                No public timeline updates published yet.
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
              How Awaz Maintains Integrity &amp; Consumer Trust
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#5B6573] leading-relaxed">
              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Allegations vs. Facts</h3>
                <p>
                  Individual submissions reflect consumers&apos; stated experiences and are not judicial findings or government audits. We provide an evidence repository, not court verdicts.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#2457D6]" />
                  <span>Privacy by Default</span>
                </h3>
                <p>
                  Order numbers, full names, addresses, phone numbers, and raw evidence files are private. Public dashboards only expose non-sensitive aggregated metrics.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Independent Deduplication</h3>
                <p>
                  We track unique individuals separately from raw submission counts and apply algorithmic duplicate detection to prevent spam or artificial inflation.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-[#17212F] text-sm">Right of Reply &amp; Dispute</h3>
                <p>
                  Companies and consumers may review published methodology and request corrections if factual inaccuracies or verified redressals occur.
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
              <Link href="/terms" className="text-[#5B6573] hover:text-[#17212F]">
                Acceptable Use Policy
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
