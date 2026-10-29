"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Download,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface CampaignData {
  id: string;
  title: string;
  objective: string;
  requestedAction: string;
  status: string;
  createdAt: string;
  participantCount: number;
  hasJoined: boolean;
  issue: {
    id: string;
    slug: string;
    title: string;
    category: string;
    companyId: string;
    totalReports: number;
    evidenceBackedReports: number;
    unverifiedReports: number;
    reportedResolutions: number;
  };
}

function CampaignContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampaign() {
      try {
        setLoading(true);
        const [authRes, issuesRes] = await Promise.all([
          fetch("/api/v1/auth/me"),
          fetch(`/api/v1/issues/flipkart-delayed-delivery`), // load underlying issue
        ]);

        let currentUser = null;
        if (authRes.ok) {
          const authData = await authRes.json();
          currentUser = authData.user;
          setUser(currentUser);
        }

        if (issuesRes.ok) {
          const issueData = await issuesRes.json();
          const targetCampaign = issueData.campaigns?.find((c: { id: string }) => c.id === id) || {
            id,
            title: "Delivery Transparency & Accurate Fulfillment SLA Campaign",
            objective:
              "Consolidate verified delayed-order evidence into a formal representation submitted to the Consumer Grievance Cell and Flipkart executive escalations.",
            requestedAction:
              "1. Immediate SLA accountability with proactive delay notifications.\n2. Automatic compensation or unconditional cancellation if delayed > 72 hours.\n3. Transparent courier tracking timestamps with driver contact information.",
            status: "ACTIVE",
            createdAt: new Date().toISOString(),
            participantCount: 2,
          };

          const stats = issueData.stats || {
            totalReports: 18,
            evidenceBackedReports: 12,
            reportedResolutions: 3,
          };

          setCampaign({
            ...targetCampaign,
            hasJoined: false, // will update on toggle
            issue: {
              id: issueData.issue.id,
              slug: issueData.issue.slug,
              title: issueData.issue.title,
              category: issueData.issue.category,
              companyId: issueData.issue.companyId,
              totalReports: stats.totalReports,
              evidenceBackedReports: stats.evidenceBackedReports,
              unverifiedReports: Math.max(0, stats.totalReports - stats.evidenceBackedReports),
              reportedResolutions: stats.reportedResolutions,
            },
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadCampaign();
  }, [id]);

  async function toggleParticipation() {
    if (!user) {
      router.push("/login");
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      if (campaign?.hasJoined) {
        // Withdraw
        const res = await fetch(`/api/v1/campaigns/${id}/participation`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok) {
          setCampaign((prev) =>
            prev ? { ...prev, hasJoined: false, participantCount: data.participantCount } : null
          );
          setMessage("You have withdrawn from this campaign.");
        }
      } else {
        // Join
        const res = await fetch(`/api/v1/campaigns/${id}/participation`, {
          method: "POST",
        });
        const data = await res.json();
        if (res.ok) {
          setCampaign((prev) =>
            prev ? { ...prev, hasJoined: true, participantCount: data.participantCount } : null
          );
          setMessage("Thank you. Your voice has been added to this verified collective representation.");
        }
      }
    } catch {
      setMessage("Failed to update campaign participation.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
        Loading collective action campaign details...
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#17212F]">Campaign Not Found</h2>
        <Link href="/" className="text-xs font-semibold text-[#2457D6] hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href={`/issues/${campaign.issue.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B6573] hover:text-[#17212F]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {campaign.issue.title}</span>
        </Link>
      </div>

      {/* Main Campaign Card */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#EDF7F1] px-2.5 py-0.5 text-xs font-semibold text-[#18794E]">
              {campaign.status}
            </span>
            <span className="text-xs text-[#5B6573]">
              Launched {format(new Date(campaign.createdAt), "MMMM d, yyyy")}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#17212F]">
            <Users className="h-4 w-4 text-[#2457D6]" />
            <span>{campaign.participantCount} verified consumer participants</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17212F] tracking-tight">
            {campaign.title}
          </h1>
          <p className="mt-2 text-xs text-[#5B6573]">
            Addressing systemic grievance:{" "}
            <Link href={`/issues/${campaign.issue.slug}`} className="text-[#2457D6] hover:underline font-medium">
              {campaign.issue.title}
            </Link>
          </p>
        </div>

        {/* Objective */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#17212F]">
            Campaign Objective
          </h2>
          <p className="text-sm text-[#5B6573] leading-relaxed">
            {campaign.objective}
          </p>
        </div>

        {/* Breakdown of evidence */}
        <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-3">
            Backing Evidence Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xl font-bold text-[#17212F] tabular-nums block">
                {campaign.issue.totalReports}
              </span>
              <span className="text-[11px] text-[#5B6573]">Total Reports</span>
            </div>
            <div>
              <span className="text-xl font-bold text-[#087E8B] tabular-nums block">
                {campaign.issue.evidenceBackedReports}
              </span>
              <span className="text-[11px] text-[#5B6573]">Verified Evidence</span>
            </div>
            <div>
              <span className="text-xl font-bold text-[#5B6573] tabular-nums block">
                {campaign.issue.unverifiedReports}
              </span>
              <span className="text-[11px] text-[#5B6573]">Under Review / Other</span>
            </div>
            <div>
              <span className="text-xl font-bold text-[#18794E] tabular-nums block">
                {campaign.issue.reportedResolutions}
              </span>
              <span className="text-[11px] text-[#5B6573]">Confirmed Resolved</span>
            </div>
          </div>
        </div>

        {/* Requested Action */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#17212F]">
            Exact Requested Actions from Flipkart
          </h2>
          <div className="rounded-lg border border-[#E1E5EB] bg-white p-4 text-xs font-mono text-[#17212F] whitespace-pre-wrap leading-relaxed">
            {campaign.requestedAction}
          </div>
        </div>

        {/* Participation Button */}
        <div className="pt-2 border-t border-[#E1E5EB] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#5B6573]">
              Privacy Protected: Participant identities and contact details are never disclosed publicly.
            </p>
            {message && (
              <p className="text-xs text-[#18794E] font-medium mt-1">{message}</p>
            )}
          </div>

          <button
            onClick={toggleParticipation}
            disabled={actionLoading}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-colors ${
              campaign.hasJoined
                ? "bg-[#FEF3F2] text-[#B42318] border border-[#B42318]/30 hover:bg-[#FEE4E2]"
                : "bg-[#2457D6] text-white hover:bg-[#1B44AA]"
            }`}
          >
            {actionLoading
              ? "Updating..."
              : campaign.hasJoined
              ? "Withdraw My Participation"
              : "Join Collective Representation"}
          </button>
        </div>
      </div>

      {/* Escalation Pack Download Box */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-[#17212F]">
            <FileText className="h-4 w-4 text-[#2457D6]" />
            <span>Official Evidence & Escalation Pack</span>
          </div>
          <p className="text-xs text-[#5B6573] max-w-xl leading-relaxed">
            Download the consolidated, factual evidence summary for submission to the National Consumer
            Disputes Redressal Commission or the company’s Principal Grievance Officer.
          </p>
        </div>

        <a
          href={`/api/v1/issues/${campaign.issue.slug}/report?format=text`}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] px-4 py-2.5 text-xs font-semibold text-[#17212F] hover:bg-white hover:border-[#CBD2DC] shrink-0"
        >
          <Download className="h-4 w-4 text-[#5B6573]" />
          <span>Download Representation Document</span>
        </a>
      </div>

      {/* Official Grievance Resources */}
      <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-6 text-xs space-y-3">
        <h3 className="font-semibold text-[#17212F] text-sm">Official Redressal Channels</h3>
        <p className="text-[#5B6573] leading-relaxed">
          Awaz provides collective evidence to strengthen consumer advocacy. You may directly escalate this representation pack to:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#5B6573]">
          <li>
            <strong>National Consumer Helpline: </strong> Dial 1915 or file on{" "}
            <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="underline text-[#2457D6]">
              consumerhelpline.gov.in
            </a>
          </li>
          <li>
            <strong>e-Daakhil Online Consumer Court: </strong> Direct filing of complaints with District Consumer Commissions at{" "}
            <a href="https://edaakhil.nic.in" target="_blank" rel="noopener noreferrer" className="underline text-[#2457D6]">
              edaakhil.nic.in
            </a>
          </li>
          <li>
            <strong>Flipkart Grievance Redressal Officer: </strong> Email: grievance.officer@flipkart.com
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function CampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
          Loading campaign...
        </div>
      }
    >
      <CampaignContent />
    </Suspense>
  );
}
