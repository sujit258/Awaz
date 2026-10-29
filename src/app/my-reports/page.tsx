"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Clock,
  ExternalLink,
  Shield,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface ReportItem {
  id: string;
  referenceNumber: string;
  summary: string;
  description: string;
  orderStatus: "AWAITING_DELIVERY" | "DELIVERED" | "CANCELLED" | "UNKNOWN";
  complaintStatus: "OPEN" | "RESOLVED_BY_CUSTOMER" | "DISPUTED" | "UNDER_REVIEW";
  verificationStatus: "UNVERIFIED" | "EVIDENCE_SUBMITTED" | "VERIFIED" | "REJECTED";
  promisedDeliveryDate: string | null;
  createdAt: string;
  issue: {
    id: string;
    slug: string;
    title: string;
    companyId: string;
  };
  evidence: Array<{
    id: string;
    fileName: string;
    reviewStatus: string;
    redactionStatus: string;
    createdAt: string;
  }>;
}

function formatDateSafe(dateStr?: string | null, fallback = "Date unavailable") {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return format(d, "MMM d, yyyy");
  } catch {
    return fallback;
  }
}

export default function MyReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const authRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
        if (!authRes.ok) {
          if (!ignore) {
            setUser(null);
            setReports([]);
            setLoading(false);
          }
          return;
        }

        const authData = await authRes.json();
        if (!authData.user) {
          if (!ignore) {
            setUser(null);
            setReports([]);
            setLoading(false);
          }
          return;
        }
        if (!ignore) setUser(authData.user);

        const reportsRes = await fetch("/api/v1/my-reports", { cache: "no-store" });
        if (!reportsRes.ok) {
          const errData = await reportsRes.json().catch(() => ({}));
          if (!ignore) setError(errData.error || "Failed to load your complaint reports.");
          return;
        }

        const data = await reportsRes.json();
        if (!ignore) setReports(data.reports || []);
      } catch (err) {
        console.error("My reports loading error:", err);
        if (!ignore) setError("Network error while connecting to server. Please check your connection.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, []);

  async function reloadReports() {
    setLoading(true);
    setError(null);
    try {
      const reportsRes = await fetch("/api/v1/my-reports", { cache: "no-store" });
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      } else {
        const errData = await reportsRes.json().catch(() => ({}));
        setError(errData.error || "Failed to reload reports.");
      }
    } catch {
      setError("Network error reloading reports.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(
    reportId: string,
    orderStatus?: string,
    complaintStatus?: string
  ) {
    try {
      setUpdatingId(reportId);
      setStatusMessage(null);

      const payload: Record<string, string> = {};
      if (orderStatus) payload.orderStatus = orderStatus;
      if (complaintStatus) payload.complaintStatus = complaintStatus;

      const res = await fetch(`/api/v1/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatusMessage("Report status updated successfully.");
        await reloadReports();
      } else {
        const data = await res.json().catch(() => ({}));
        setStatusMessage(data.error || "Failed to update report status.");
      }
    } catch {
      setStatusMessage("Network error updating report.");
    } finally {
      setUpdatingId(null);
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center space-y-4">
        <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-[#2457D6] border-t-transparent text-[#2457D6]">
          <RefreshCw className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-[#5B6573]">
          Loading your complaint reports…
        </p>
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-5">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA] border border-[#E1E5EB] text-[#5B6573]">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#17212F]">Sign in to View Your Reports</h2>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            You must be signed in to manage complaint dossiers linked to your citizen account.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login?redirect=/my-reports"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#2457D6] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1B44AA] transition-colors"
          >
            <span>Sign In / Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/track"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#E1E5EB] bg-white px-4 py-2.5 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA]"
          >
            <span>Track Anonymous Report</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Authenticated View
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E5EB] pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3 py-0.5 text-xs font-semibold text-[#18794E] mb-2">
            <Shield className="h-3 w-3" />
            <span>Citizen Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17212F]">
            My Complaint Reports
          </h1>
          <p className="text-xs text-[#5B6573] mt-1">
            Authenticated as <strong className="text-[#17212F]">{user.email}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => reloadReports()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E1E5EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA] transition-colors shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#5B6573]" />
            <span>Refresh</span>
          </button>

          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] transition-colors"
          >
            <span>Report Another Issue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div className="rounded-xl bg-[#EDF7F1] border border-[#18794E]/20 p-3.5 text-xs text-[#18794E] flex items-center justify-between">
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[#FEF3F2] border border-[#B42318]/20 p-4 text-xs text-[#B42318] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => reloadReports()}
            className="rounded-lg bg-[#B42318] text-white px-3 py-1 font-semibold hover:bg-[#911d13]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E1E5EB] bg-white p-12 text-center space-y-4">
          <FileText className="mx-auto h-10 w-10 text-[#5B6573]/50" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#17212F]">No Reports Filed Under This Account</h3>
            <p className="text-xs text-[#5B6573] max-w-sm mx-auto leading-relaxed">
              You haven’t submitted any complaint reports with this account. If an order has passed its promised delivery date, document it to make it visible.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#1B44AA] transition-colors"
            >
              Submit Your First Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-5 hover:border-[#CBD2DC] transition-colors"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E1E5EB] pb-3.5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#17212F] bg-[#F7F8FA] border border-[#E1E5EB] px-2.5 py-1 rounded-md">
                    {report.referenceNumber}
                  </span>
                  <Link
                    href={`/issues/${report.issue.slug}`}
                    className="text-xs font-bold text-[#2457D6] hover:underline inline-flex items-center gap-1"
                  >
                    <span>{report.issue.title}</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Verification Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                      report.verificationStatus === "VERIFIED"
                        ? "bg-[#EDF7F1] text-[#18794E]"
                        : report.verificationStatus === "EVIDENCE_SUBMITTED"
                        ? "bg-[#FEF7E6] text-[#946200]"
                        : report.verificationStatus === "REJECTED"
                        ? "bg-[#FEF3F2] text-[#B42318]"
                        : "bg-[#F7F8FA] text-[#5B6573] border border-[#E1E5EB]"
                    }`}
                  >
                    {report.verificationStatus}
                  </span>

                  {/* Complaint Status Badge */}
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                      report.complaintStatus === "RESOLVED_BY_CUSTOMER"
                        ? "bg-[#EDF7F1] text-[#18794E]"
                        : "bg-[#F7F8FA] text-[#172B4D] border border-[#E1E5EB]"
                    }`}
                  >
                    {report.complaintStatus}
                  </span>
                </div>
              </div>

              {/* Summary & Description */}
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-[#17212F]">{report.summary}</h3>
                <p className="text-xs text-[#5B6573] leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              {/* Evidence Section */}
              <div className="rounded-xl bg-[#F7F8FA] p-4 border border-[#E1E5EB] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17212F]">Attached Evidence Files:</span>
                  <span className="text-[#5B6573]">
                    {report.evidence ? report.evidence.length : 0} file
                    {report.evidence && report.evidence.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {!report.evidence || report.evidence.length === 0 ? (
                  <p className="text-[#5B6573] italic">No evidence uploaded yet (unverified status).</p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {report.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between py-1.5 border-t border-[#E1E5EB]/60 first:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-[#087E8B]" />
                          <span className="font-mono text-[11px] text-[#17212F] font-semibold">
                            {ev.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-[#087E8B] bg-white px-2 py-0.5 rounded border border-[#E1E5EB]">
                            {ev.reviewStatus}
                          </span>
                          <a
                            href={`/api/v1/evidence/${ev.id}?download=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-[#E1E5EB] text-[10px] font-bold text-[#2457D6] hover:bg-[#EFF4FF]"
                          >
                            <span>Download</span>
                            <Download className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Citizen Actions: Update Delivery & Resolution Status */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E5EB]">
                <div className="flex items-center gap-2 text-[11px] text-[#5B6573]">
                  <Clock className="h-3.5 w-3.5 text-[#5B6573]" />
                  <span>Submitted on {formatDateSafe(report.createdAt)}</span>
                  {report.promisedDeliveryDate && (
                    <span className="border-l border-[#E1E5EB] pl-2">
                      Promised delivery: {formatDateSafe(report.promisedDeliveryDate)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {report.complaintStatus !== "RESOLVED_BY_CUSTOMER" ? (
                    <button
                      disabled={updatingId === report.id}
                      onClick={() =>
                        handleStatusUpdate(
                          report.id,
                          "DELIVERED",
                          "RESOLVED_BY_CUSTOMER"
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#18794E] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#125838] transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{updatingId === report.id ? "Updating…" : "Confirm Delivery & Mark Resolved"}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#18794E] bg-[#EDF7F1] border border-[#18794E]/20 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Resolution Confirmed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
