"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface AdminReport {
  id: string;
  referenceNumber: string;
  summary: string;
  description: string;
  orderStatus: string;
  complaintStatus: string;
  verificationStatus: "UNVERIFIED" | "EVIDENCE_SUBMITTED" | "VERIFIED" | "REJECTED";
  promisedDeliveryDate: string | null;
  approximateRegion: string | null;
  orderReference: string | null;
  isDeleted: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    role: string;
  } | null;
  issue: {
    id: string;
    slug: string;
    title: string;
    category: string;
  };
  evidence: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    reviewStatus: string;
    redactionStatus: string;
  }>;
}

function formatDateSafe(dateStr?: string | null, fallback = "Not specified") {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return format(d, "MMM d, yyyy");
  } catch {
    return fallback;
  }
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState("ALL");

  // Modal / Action state
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function init() {
      try {
        const authRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
        if (!authRes.ok) {
          if (!ignore) {
            setCurrentUser(null);
            setReports([]);
            setLoading(false);
          }
          return;
        }

        const authData = await authRes.json();
        if (!ignore) setCurrentUser(authData.user);

        if (!authData.user || (authData.user.role !== "ADMIN" && authData.user.role !== "MODERATOR")) {
          if (!ignore) setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (verificationFilter !== "ALL") {
          params.set("verificationStatus", verificationFilter);
        }

        const res = await fetch(`/api/v1/admin/reports?${params.toString()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (!ignore) setReports(data.reports || []);
        } else {
          const errData = await res.json().catch(() => ({}));
          if (!ignore) setError(errData.error || "Failed to load moderation reports.");
        }
      } catch (err) {
        console.error("Moderation queue fetch error:", err);
        if (!ignore) setError("Network or server connection error while loading moderation queue.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    init();

    return () => {
      ignore = true;
    };
  }, [verificationFilter]);

  async function reloadReports() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (verificationFilter !== "ALL") {
        params.set("verificationStatus", verificationFilter);
      }
      const res = await fetch(`/api/v1/admin/reports?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to load moderation reports.");
      }
    } catch {
      setError("Network or server connection error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerificationReview(
    status: "VERIFIED" | "REJECTED",
    evidenceId?: string
  ) {
    if (!selectedReport) return;
    setActionLoading(true);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/admin/reports/${selectedReport.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: status,
          reviewNote: reviewNote || `Marked ${status} by verification officer`,
          evidenceId: evidenceId || selectedReport.evidence?.[0]?.id || null,
          evidenceStatus: status,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Report ${selectedReport.referenceNumber} status set to ${status}.`);
        setSelectedReport(null);
        setReviewNote("");
        await reloadReports();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to submit verification review.");
      }
    } catch {
      alert("Network error while submitting verification review.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleModerationAction(action: "FLAG_DUPLICATE" | "REJECT") {
    if (!selectedReport) return;
    setActionLoading(true);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/v1/admin/reports/${selectedReport.id}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: reviewNote || `Applied ${action} action in moderation`,
          targetType: "REPORT",
          targetId: selectedReport.id,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Applied action ${action} to ${selectedReport.referenceNumber}.`);
        setSelectedReport(null);
        setReviewNote("");
        await reloadReports();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to submit moderation action.");
      }
    } catch {
      alert("Network error while submitting moderation action.");
    } finally {
      setActionLoading(false);
    }
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-[#2457D6] border-t-transparent text-[#2457D6]">
          <RefreshCw className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-[#5B6573]">
          Checking staff credentials & loading moderation queue…
        </p>
      </div>
    );
  }

  // 2. Access Restricted (Unauthenticated or Non-staff Citizen)
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF3F2] text-[#B42318]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#17212F]">Staff Access Restricted</h2>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            This console is reserved for authorized Awaz verification officers and moderators. Please sign in with staff credentials.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/login?redirect=/admin"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1B44AA] transition-colors"
          >
            <span>Sign In as Staff</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 3. Authorized Console View
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E5EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#087E8B] px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              Moderation Console
            </span>
            <span className="text-xs font-semibold text-[#5B6573]">
              Role: <span className="text-[#17212F]">{currentUser.role}</span> ({currentUser.email})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#17212F] mt-1">
            Evidence Verification & Complaint Queue
          </h1>
        </div>

        <button
          onClick={() => reloadReports()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA] transition-colors shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 p-3.5 text-xs text-[#18794E] flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button
            onClick={() => setActionSuccess(null)}
            className="font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-4 text-xs text-[#B42318] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => reloadReports()}
            className="rounded bg-[#B42318] text-white px-3 py-1 font-semibold hover:bg-[#911d13]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E1E5EB] shadow-xs text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#5B6573]" />
          <span className="font-semibold text-[#5B6573]">Filter Status:</span>
          {["ALL", "EVIDENCE_SUBMITTED", "UNVERIFIED", "VERIFIED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setVerificationFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                verificationFilter === st
                  ? "bg-[#2457D6] text-white font-semibold"
                  : "bg-[#F7F8FA] text-[#5B6573] hover:text-[#17212F] hover:bg-[#EAECEF]"
              }`}
            >
              {st === "ALL" ? "All Statuses" : st}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#5B6573]">
          Showing <strong>{reports.length}</strong> report{reports.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E1E5EB] bg-[#F7F8FA] text-[#5B6573]">
                <th className="py-3 px-4 font-semibold">Ref Number</th>
                <th className="py-3 px-4 font-semibold">Issue Category</th>
                <th className="py-3 px-4 font-semibold">Reporter</th>
                <th className="py-3 px-4 font-semibold">Complaint Status</th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold">Evidence</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5EB]">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center space-y-2">
                    <FileText className="mx-auto h-8 w-8 text-[#5B6573]/50" />
                    <p className="font-semibold text-sm text-[#17212F]">
                      Moderation queue is empty
                    </p>
                    <p className="text-xs text-[#5B6573]">
                      {verificationFilter === "ALL"
                        ? "There are currently no active complaint reports awaiting moderation."
                        : `No reports found matching the '${verificationFilter}' filter.`}
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#17212F]">
                      {rep.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#17212F] block max-w-xs truncate">
                        {rep.issue?.title || "Unknown Issue"}
                      </span>
                      <span className="text-[10px] text-[#5B6573]">
                        {rep.approximateRegion || "India"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#5B6573]">
                      {rep.user?.email ? (
                        <span className="font-medium text-[#17212F]">{rep.user.email}</span>
                      ) : (
                        <span className="italic text-[#8A94A6]">Anonymous Citizen</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                          {rep.complaintStatus}
                        </span>
                        {rep.isDeleted && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FEF3F2] text-[#B42318] border border-[#B42318]/20">
                            WITHDRAWN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rep.verificationStatus === "VERIFIED"
                            ? "bg-[#EDF7F1] text-[#18794E]"
                            : rep.verificationStatus === "EVIDENCE_SUBMITTED"
                            ? "bg-[#FEF7E6] text-[#946200]"
                            : rep.verificationStatus === "REJECTED"
                            ? "bg-[#FEF3F2] text-[#B42318]"
                            : "bg-[#F7F8FA] text-[#5B6573]"
                        }`}
                      >
                        {rep.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {rep.evidence && rep.evidence.length > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#087E8B]">
                          <FileText className="h-3 w-3" />
                          {rep.evidence.length} file{rep.evidence.length !== 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-[#5B6573] italic">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="inline-flex items-center gap-1 rounded bg-[#2457D6] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1B44AA] transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E1E5EB] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#17212F]">
                  Review Report {selectedReport.referenceNumber}
                </h3>
                <span className="text-xs text-[#5B6573]">{selectedReport.issue?.title}</span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-[#5B6573] hover:text-[#17212F] text-lg font-bold p-1"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Private Details */}
            <div className="rounded-lg bg-[#F7F8FA] p-4 text-xs space-y-2 border border-[#E1E5EB]">
              <div className="grid grid-cols-2 gap-2 text-[#5B6573]">
                <div>
                  Reporter:{" "}
                  <strong className="text-[#17212F]">
                    {selectedReport.user?.email || "Anonymous Citizen"}
                  </strong>
                </div>
                <div>
                  Region:{" "}
                  <strong className="text-[#17212F]">
                    {selectedReport.approximateRegion || "Unspecified"}
                  </strong>
                </div>
                <div>
                  Promised Date:{" "}
                  <strong className="text-[#17212F]">
                    {formatDateSafe(selectedReport.promisedDeliveryDate, "Not specified")}
                  </strong>
                </div>
                <div>
                  Order Status:{" "}
                  <strong className="text-[#17212F]">{selectedReport.orderStatus}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-[#E1E5EB]">
                <span className="text-[#5B6573] block mb-1">Full Summary:</span>
                <p className="text-[#17212F] font-semibold mb-2">{selectedReport.summary}</p>
                <span className="text-[#5B6573] block mb-1">Citizen Narrative:</span>
                <p className="text-[#17212F] whitespace-pre-wrap leading-relaxed">
                  {selectedReport.description}
                </p>
              </div>
            </div>

            {/* Evidence details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#17212F]">
                Attached Evidence Files ({selectedReport.evidence ? selectedReport.evidence.length : 0})
              </h4>
              {!selectedReport.evidence || selectedReport.evidence.length === 0 ? (
                <p className="text-xs text-[#5B6573] italic">No evidence files attached to this report.</p>
              ) : (
                <div className="space-y-2">
                  {selectedReport.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#E1E5EB] bg-white text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#087E8B]" />
                        <div>
                          <p className="font-semibold text-[#17212F]">{ev.fileName}</p>
                          <p className="text-[10px] text-[#5B6573]">
                            {(ev.fileSize / 1024).toFixed(1)} KB • Review: {ev.reviewStatus}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/v1/evidence/${ev.id}?download=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F7F8FA] text-[#17212F] border border-[#E1E5EB] hover:bg-[#EAECEF] font-semibold text-[10px]"
                          title="Download authorized evidence file"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View File</span>
                        </a>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleVerificationReview("VERIFIED", ev.id)}
                          className="px-2 py-1 rounded bg-[#EDF7F1] text-[#18794E] hover:bg-[#D4EEDF] font-semibold text-[10px]"
                        >
                          Approve Evidence
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleVerificationReview("REJECTED", ev.id)}
                          className="px-2 py-1 rounded bg-[#FEF3F2] text-[#B42318] hover:bg-[#FDD8D5] font-semibold text-[10px]"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Note */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#17212F] block">
                Verification Note (Internal Audit Log)
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Reasoning for verification determination (e.g., invoice order ID confirmed, date verified, screenshot clear)..."
                rows={2}
                className="w-full rounded-lg border border-[#E1E5EB] p-2.5 text-xs focus:border-[#2457D6] focus:outline-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E1E5EB]">
              <div className="flex items-center gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => handleModerationAction("FLAG_DUPLICATE")}
                  className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] px-3 py-1.5 text-xs font-semibold text-[#17212F] hover:bg-[#EAECEF] disabled:opacity-50"
                >
                  Flag Duplicate
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleModerationAction("REJECT")}
                  className="rounded-lg border border-[#B42318]/20 bg-[#FEF3F2] px-3 py-1.5 text-xs font-semibold text-[#B42318] hover:bg-[#FDD8D5] disabled:opacity-50"
                >
                  Reject Report
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={actionLoading}
                  onClick={() => setSelectedReport(null)}
                  className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B6573] hover:bg-[#F7F8FA]"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleVerificationReview("VERIFIED")}
                  className="rounded-lg bg-[#18794E] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#125838] disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Mark Verified</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
