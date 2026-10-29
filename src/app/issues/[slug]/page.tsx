"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
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
  const [copiedLink, setCopiedLink] = useState(false);

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
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-sm text-[#5B6573] animate-pulse">
        Retrieving verified issue record from public evidence registry...
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#17212F]">Issue Registry Record Not Found</h2>
        <p className="text-xs text-[#5B6573]">
          The requested issue slug does not exist or is currently inactive.
        </p>
        <div className="pt-2">
          <Link
            href="/issues"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] px-5 py-2.5 text-xs font-bold text-white"
          >
            Return to Issues Directory
          </Link>
        </div>
      </div>
    );
  }

  const isZeroState = stats ? stats.totalReports === 0 : true;
  const isSingleReport = stats ? stats.totalReports === 1 : false;

  // Format non-redundant dates
  const isSameDate = firstReportDate && latestReportDate &&
    format(new Date(firstReportDate), "yyyy-MM-dd") === format(new Date(latestReportDate), "yyyy-MM-dd");

  return (
    <div className="space-y-10 sm:space-y-12 pb-20">
      {/* Editorial Header Banner */}
      <section className="bg-white border-b border-[#E1E5EB] py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#F7F8FA] border border-[#E1E5EB] px-2.5 py-1 text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                  Target: {issue.companyId}
                </span>
                <span className="rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 px-2.5 py-1 text-xs font-semibold text-[#18794E]">
                  Scope: {issue.category.replace("_", " ")}
                </span>
                <span className="text-xs text-[#5B6573] border-l border-[#E1E5EB] pl-2 font-medium">
                  {isZeroState ? "Monitored Category" : "Active Public Record"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#17212F] tracking-tight leading-tight">
                {issue.title}
              </h1>

              {/* Neutral Scope Description */}
              <p className="text-sm sm:text-base text-[#5B6573] leading-relaxed">
                {issue.description}
              </p>

              {/* Non-Redundant Date Strip */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5B6573] pt-1 border-t border-[#E1E5EB]/60">
                {isZeroState ? (
                  <span className="flex items-center gap-1.5 text-[#5B6573]">
                    <Clock className="h-3.5 w-3.5 text-[#5B6573]" />
                    Awaiting initial customer documentation
                  </span>
                ) : isSingleReport || isSameDate ? (
                  <span className="flex items-center gap-1.5 text-[#17212F] font-semibold">
                    <Calendar className="h-3.5 w-3.5 text-[#2457D6]" />
                    Reported on {format(new Date(firstReportDate!), "MMMM d, yyyy")}
                  </span>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-[#5B6573]" />
                      Earliest: <strong>{format(new Date(firstReportDate!), "MMM d, yyyy")}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#5B6573]" />
                      Latest: <strong>{format(new Date(latestReportDate!), "MMM d, yyyy")}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Card */}
            <div className="flex flex-col gap-2.5 w-full sm:w-auto shrink-0 bg-[#F7F8FA] p-4 rounded-2xl border border-[#E1E5EB]">
              <Link
                href={`/report?issue=${issue.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2457D6] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-[#1B44AA] transition-colors"
              >
                <span>Report Similar Grievance</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={`/api/v1/issues/${issue.slug}/report?format=text`}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E1E5EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#17212F] shadow-2xs hover:bg-[#F7F8FA] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[#5B6573]" />
                <span>Export Escalation Pack</span>
              </a>

              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E1E5EB] bg-white px-4 py-2 text-xs font-semibold text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA] transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{copiedLink ? "Link Copied!" : "Share Public Record"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dossier Body */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Independence Notice */}
        <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-xs text-[#5B6573] flex items-start gap-2.5">
          <HelpCircle className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
          <span>
            <strong>Legal Notice: </strong> Records reflect customers&apos; stated allegations and voluntary evidence submitted under our public standard. Awaz does not adjudicate legal liability or represent the named retailer.
          </span>
        </div>

        {/* 4-Tier Evidence Telemetry */}
        <section aria-labelledby="issue-metrics" className="space-y-4">
          <h2 id="issue-metrics" className="text-sm font-bold uppercase tracking-wider text-[#5B6573]">
            Verified Evidence Telemetry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Eligible Reports"
              value={stats ? stats.totalReports : 0}
              definition="Verified customer submissions satisfying fulfillment SLA criteria under this category."
              subtext="Factual grievance records"
              accentColor="blue"
            />

            <StatCard
              label="Unique Reporters"
              value={stats ? stats.uniqueReporters : 0}
              definition="Distinct registered user accounts and anonymous filing citizens reporting this issue."
              subtext="Independent individuals affected"
              accentColor="teal"
            />

            <StatCard
              label="Evidence Submitted"
              value={stats ? stats.evidenceBackedReports : 0}
              definition="Reports where the consumer voluntarily attached invoices, screenshots, or delivery correspondence."
              subtext={
                stats && stats.totalReports > 0
                  ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}% of reported cases`
                  : "Private & optional"
              }
              accentColor="teal"
            />

            <StatCard
              label="Reported Resolutions"
              value={stats ? stats.reportedResolutions : 0}
              definition="Complaints where the reporting customer explicitly confirmed package delivery or refund."
              subtext={
                stats && stats.totalReports > 0
                  ? `${stats.resolutionRatePct}% confirmed by customer`
                  : "Confirmed by reporter"
              }
              accentColor="green"
            />
          </div>
        </section>

        {/* Adaptive Telemetry Chart */}
        <section aria-labelledby="issue-telemetry">
          <TrendChart
            trends={trends}
            range={trendRange}
            onRangeChange={(r) => setTrendRange(r)}
            loading={loading}
          />
        </section>

        {/* Multi-Column Dossier: Collective Action & Geographic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voluntary Campaigns Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#2457D6]" />
                Voluntary Collective Representation
              </h2>
            </div>

            {campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#E1E5EB] bg-white p-6 text-center text-xs text-[#5B6573] space-y-1">
                <p className="font-semibold text-[#17212F]">No collective action campaign opened yet</p>
                <p>Campaigns are formed when multiple consumers document identical systemic fulfillment failures.</p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div key={c.id} className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-[#EDF7F1] px-2.5 py-0.5 text-xs font-bold text-[#18794E]">
                      {c.status}
                    </span>
                    <span className="text-xs text-[#5B6573] font-medium">
                      {c.participantCount} customer{c.participantCount !== 1 ? "s" : ""} participating
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#17212F]">{c.title}</h3>
                  <p className="text-xs text-[#5B6573] leading-relaxed">{c.objective}</p>

                  <div className="rounded-xl bg-[#F7F8FA] p-3.5 text-xs border border-[#E1E5EB] space-y-1">
                    <span className="font-semibold text-[#17212F] block">Requested Corrective Resolution:</span>
                    <p className="text-[#5B6573] whitespace-pre-wrap">{c.requestedAction}</p>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <Link
                      href={`/campaigns/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6] px-4 py-2 text-xs font-bold text-white hover:bg-[#1B44AA] transition-colors"
                    >
                      <span>Join Campaign &amp; Access Dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Regional Geographic Distribution Column */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#087E8B]" />
              Geographic Distribution
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-3">
              <p className="text-xs text-[#5B6573]">
                Anonymized complaint volume grouped by Indian State or Union Territory:
              </p>
              {regions.length === 0 ? (
                <div className="rounded-xl bg-[#F7F8FA] p-4 text-center text-xs text-[#5B6573]">
                  No regional logs recorded yet. State breakdown populates automatically upon verified submissions.
                </div>
              ) : (
                <div className="space-y-2">
                  {regions.map((r) => (
                    <div
                      key={r.region}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-[#E1E5EB]/60 last:border-0"
                    >
                      <span className="font-semibold text-[#17212F]">{r.region}</span>
                      <span className="tabular-nums font-bold text-[#2457D6] bg-[#EFF4FF] px-2 py-0.5 rounded-md">
                        {r.count} report{r.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Public Timeline Updates & Milestones */}
        <section aria-labelledby="updates-heading">
          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-4">
            <h2 id="updates-heading" className="text-base font-bold text-[#17212F] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#087E8B]" />
              Public Milestones &amp; Investigation History
            </h2>
            {updates.length === 0 ? (
              <p className="text-xs text-[#5B6573] py-2">
                No public timeline updates logged yet for this category.
              </p>
            ) : (
              <div className="divide-y divide-[#E1E5EB]">
                {updates.map((u) => (
                  <div key={u.id} className="py-3.5 text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                        {u.updateType.replace("_", " ")}
                      </span>
                      <span className="text-[#5B6573]">
                        {formatDistanceToNow(new Date(u.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[#17212F] leading-relaxed max-w-3xl font-medium">
                      {u.publicContent}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Dispute & Factual Correction Notice */}
        <div className="rounded-2xl border border-[#E1E5EB] bg-[#F7F8FA] p-5 text-xs text-[#5B6573] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-4 w-4 text-[#087E8B] shrink-0" />
            <span>
              Are you a consumer or retailer representative looking to verify or dispute factual accuracy?
            </span>
          </div>
          <a
            href="mailto:corrections@awaz.org?subject=Dispute%20Regarding%20Issue"
            className="text-xs font-bold text-[#2457D6] hover:underline shrink-0"
          >
            File Correction Request →
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
