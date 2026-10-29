"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Download,
  Share2,
  HelpCircle,
  Clock,
  ArrowRight,
  MapPin,
  Megaphone,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import TrendChart from "@/components/ui/TrendChart";
import { AggregateStats, DailyTrendPoint } from "@/lib/aggregation/counting";
import { format, formatDistanceToNow } from "date-fns";

interface RegionItem {
  region: string;
  count: number;
}

interface IssueUpdateItem {
  id: string;
  updateType: string;
  publicContent: string;
  publishedAt: string;
}

interface CampaignItem {
  id: string;
  title: string;
  objective: string;
  requestedAction: string;
  status: string;
  createdAt: string;
  participantCount: number;
}

function IssueDetailContent() {
  const params = useParams();
  const slug = params.slug as string;

  const [issue, setIssue] = useState<{
    id: string;
    slug: string;
    companyId: string;
    category: string;
    title: string;
    description: string;
    publishedAt: string;
    updatedAt: string;
  } | null>(null);

  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [trends, setTrends] = useState<DailyTrendPoint[]>([]);
  const [trendRange, setTrendRange] = useState<7 | 30>(30);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [updates, setUpdates] = useState<IssueUpdateItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [firstReportDate, setFirstReportDate] = useState<string | null>(null);
  const [latestReportDate, setLatestReportDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/issues/${slug}`);
        if (!res.ok) throw new Error("Issue not found");
        const data = await res.json();
        setIssue(data.issue);
        setStats(data.stats);
        setTrends(data.trends || []);
        setRegions(data.regions || []);
        setUpdates(data.updates || []);
        setCampaigns(data.campaigns || []);
        setFirstReportDate(data.firstReportDate);
        setLatestReportDate(data.latestReportDate);
      } catch (err: unknown) {
        console.error(err);
        setError("Unable to load issue information.");
      } finally {
        setLoading(false);
      }
    }
    if (slug) loadData();
  }, [slug]);

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Awaz Consumer Report: ${issue?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Page link copied to clipboard!");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
        Loading public issue evidence registry...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#17212F]">Issue Not Found</h2>
        <p className="text-xs text-[#5B6573]">
          The requested issue slug does not exist or has been archived.
        </p>
        <Link
          href="/issues"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white"
        >
          Return to Issues Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Header Banner */}
      <section className="bg-white border-b border-[#E1E5EB] py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              {/* Badges */}
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#F7F8FA] border border-[#E1E5EB] px-2.5 py-0.5 text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                  {issue.companyId}
                </span>
                <span className="rounded bg-[#EDF7F1] px-2.5 py-0.5 text-xs font-semibold text-[#18794E]">
                  {issue.category.replace("_", " ")}
                </span>
                <span className="text-xs text-[#5B6573] border-l border-[#E1E5EB] pl-2">
                  Active Issue Registry
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#17212F] tracking-tight leading-tight">
                {issue.title}
              </h1>

              <p className="text-sm sm:text-base text-[#5B6573] leading-relaxed">
                {issue.description}
              </p>

              {/* Reporting Dates Strip */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#5B6573] pt-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#5B6573]" />
                  Earliest Report: {firstReportDate ? format(new Date(firstReportDate), "MMM d, yyyy") : "Awaiting first submission"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#5B6573]" />
                  Latest Report: {latestReportDate ? format(new Date(latestReportDate), "MMM d, yyyy") : "Awaiting first submission"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
              <Link
                href="/report"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA] transition-colors"
              >
                <span>Report This Issue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <a
                href={`/api/v1/issues/${issue.slug}/report?format=text`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E1E5EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#17212F] shadow-xs hover:bg-[#F7F8FA]"
              >
                <Download className="h-3.5 w-3.5 text-[#5B6573]" />
                <span>Download Escalation Pack</span>
              </a>

              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E1E5EB] bg-white px-4 py-2 text-xs font-medium text-[#5B6573] hover:bg-[#F7F8FA]"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share Public Record</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Non-Governmental Independence & Allegation Disclaimer */}
        <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-xs text-[#5B6573] flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
          <span>
            <strong>Public Documentation Notice: </strong> Submissions reflect consumers&apos; stated experiences and allegations under our public methodology. They are not judicial findings, government orders, or company-wide statistics.
          </span>
        </div>

        {/* Statistics Grid */}
        <section aria-labelledby="issue-stats">
          <h2 id="issue-stats" className="text-sm font-semibold uppercase tracking-wider text-[#5B6573] mb-3">
            Issue Evidence Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Eligible Reports"
              value={stats ? stats.totalReports : 0}
              definition="Total eligible customer submissions under this specific issue category, excluding duplicate or withdrawn records."
              subtext="Real consumer grievance records"
              icon={<FileText className="h-4 w-4" />}
            />

            <StatCard
              label="Unique Reporters"
              value={stats ? stats.uniqueReporters : 0}
              definition="Distinct registered user accounts and anonymous filing consumers reporting this issue."
              subtext="Independent consumer submissions"
              icon={<Users className="h-4 w-4" />}
            />

            <StatCard
              label="Evidence Submitted"
              value={stats ? stats.evidenceBackedReports : 0}
              definition="Reports where the consumer voluntarily attached tracking screenshots, receipts, or courier correspondence."
              subtext={
                stats && stats.totalReports > 0
                  ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}% of reported cases`
                  : "Private & optional"
              }
              icon={<ShieldCheck className="h-4 w-4 text-[#087E8B]" />}
            />

            <StatCard
              label="Reported Resolutions"
              value={stats ? stats.reportedResolutions : 0}
              definition="Complaints where the reporting customer explicitly confirmed delivery fulfillment, replacement, or dispute settlement."
              subtext={
                stats && stats.totalReports > 0
                  ? `${stats.resolutionRatePct}% confirmed by customer`
                  : "Confirmed by reporter"
              }
              icon={<CheckCircle2 className="h-4 w-4 text-[#18794E]" />}
            />
          </div>
        </section>

        {/* 30-Day Trend Chart */}
        <section aria-labelledby="issue-trend">
          <TrendChart
            trends={trends}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
          />
        </section>

        {/* Active Action Campaigns & Regional Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Campaigns Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[#2457D6]" />
              Voluntary Collective Action Campaigns
            </h2>

            {campaigns.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-white p-6 text-center text-xs text-[#5B6573]">
                No active campaigns for this issue at present.
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-[#EDF7F1] px-2.5 py-0.5 text-xs font-semibold text-[#18794E]">
                      {c.status}
                    </span>
                    <span className="text-xs text-[#5B6573]">
                      {c.participantCount} customer{c.participantCount !== 1 ? "s" : ""} joined
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#17212F]">{c.title}</h3>
                  <p className="text-xs text-[#5B6573] leading-relaxed">{c.objective}</p>

                  <div className="rounded-lg bg-[#F7F8FA] p-3 text-xs border border-[#E1E5EB] space-y-1">
                    <span className="font-semibold text-[#17212F]">Requested Corrective Action:</span>
                    <p className="text-[#5B6573] whitespace-pre-wrap">{c.requestedAction}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1B44AA]"
                    >
                      <span>Join Campaign & View Escalation Pack</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Regional Geographic Distribution */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#087E8B]" />
              Geographic Distribution
            </h2>
            <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-3">
              <p className="text-xs text-[#5B6573]">
                Anonymized complaint volume by state or union territory:
              </p>
              {regions.length === 0 ? (
                <p className="text-xs text-[#5B6573] py-2">
                  No regional reports logged yet. Reports will appear grouped by Indian state as consumers file verified submissions.
                </p>
              ) : (
                <div className="space-y-2">
                  {regions.map((r) => (
                    <div key={r.region} className="flex items-center justify-between text-xs py-1 border-b border-[#E1E5EB]/60 last:border-0">
                      <span className="font-medium text-[#17212F]">{r.region}</span>
                      <span className="tabular-nums font-semibold text-[#2457D6]">
                        {r.count} report{r.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public Timeline Updates */}
        <section aria-labelledby="timeline-heading">
          <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-4">
            <h2 id="timeline-heading" className="text-base font-bold text-[#17212F] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#087E8B]" />
              Public Timeline Updates & Milestone History
            </h2>
            {updates.length === 0 ? (
              <p className="text-xs text-[#5B6573] py-2">No public updates logged yet.</p>
            ) : (
              <div className="divide-y divide-[#E1E5EB]">
                {updates.map((u) => (
                  <div key={u.id} className="py-3 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                        {u.updateType}
                      </span>
                      <span className="text-[#5B6573]">
                        {formatDistanceToNow(new Date(u.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[#17212F] leading-relaxed max-w-3xl">{u.publicContent}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dispute / Inaccuracy Action */}
        <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-5 text-xs text-[#5B6573] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-[#087E8B] shrink-0" />
            <span>
              Are you a consumer or retailer representative looking to correct or dispute inaccurate records?
            </span>
          </div>
          <a
            href="mailto:corrections@awaz.org?subject=Dispute%20Regarding%20Issue"
            className="text-xs font-semibold text-[#2457D6] hover:underline shrink-0"
          >
            File Correction Request
          </a>
        </div>
      </div>
    </div>
  );
}

export default function IssueDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
          Loading public issue evidence registry...
        </div>
      }
    >
      <IssueDetailContent />
    </Suspense>
  );
}
