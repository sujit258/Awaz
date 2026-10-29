"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  RefreshCw,
  Eye,
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
  promisedDeliveryDate: string;
  approximateRegion: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
  };
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

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; email: string } | null>(null);

  // Filters
  const [verificationFilter, setVerificationFilter] = useState("ALL");

  // Modal / Action state
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const authRes = await fetch("/api/v1/auth/me");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (active) setCurrentUser(authData.user);
        }

        const params = new URLSearchParams();
        if (verificationFilter !== "ALL") params.set("verificationStatus", verificationFilter);

        const res = await fetch(`/api/v1/admin/reports?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (active) setReports(data.reports || []);
        }
      } catch (e) {
        console.error(e);
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
  }, [verificationFilter]);

  async function loadReports() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (verificationFilter !== "ALL") params.set("verificationStatus", verificationFilter);

      const res = await fetch(`/api/v1/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
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
          reviewNote: reviewNote || `Marked ${status} by moderator`,
          evidenceId: evidenceId || selectedReport.evidence[0]?.id || null,
          evidenceStatus: status,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Report ${selectedReport.referenceNumber} updated to ${status}.`);
        setSelectedReport(null);
        setReviewNote("");
        await loadReports();
      }
    } catch {
      alert("Error submitting review.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleModerationAction(action: "FLAG_DUPLICATE" | "REJECT") {
    if (!selectedReport) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/v1/admin/reports/${selectedReport.id}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: reviewNote || `Applied ${action} action`,
          targetType: "REPORT",
          targetId: selectedReport.id,
        }),
      });

      if (res.ok) {
        setActionSuccess(`Applied ${action} to ${selectedReport.referenceNumber}.`);
        setSelectedReport(null);
        setReviewNote("");
        await loadReports();
      }
    } catch {
      alert("Error submitting moderation action.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MODERATOR")) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <ShieldAlert className="mx-auto h-12 w-12 text-[#B42318]" />
        <h2 className="text-xl font-bold text-[#17212F]">Access Restricted</h2>
        <p className="text-xs text-[#5B6573]">
          This area is restricted to authorized Awaz verification officers and moderators. Please sign in with staff credentials.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white"
        >
          Sign In as Staff
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E1E5EB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#087E8B] px-2.5 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              Moderation Console
            </span>
            <span className="text-xs text-[#5B6573]">Role: {currentUser.role}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#17212F] mt-1">
            Evidence Verification & Complaint Queue
          </h1>
        </div>

        <button
          onClick={loadReports}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 p-3 text-xs text-[#18794E]">
          {actionSuccess}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E1E5EB] shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[#5B6573]" />
          <span className="font-semibold text-[#5B6573]">Verification:</span>
          {["ALL", "EVIDENCE_SUBMITTED", "UNVERIFIED", "VERIFIED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setVerificationFilter(st)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                verificationFilter === st
                  ? "bg-[#2457D6] text-white"
                  : "bg-[#F7F8FA] text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              {st}
            </button>
          ))}
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
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Verification</th>
                <th className="py-3 px-4 font-semibold">Evidence</th>
                <th className="py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5EB]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6573]">
                    Loading queue...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5B6573]">
                    No reports match the active filter criteria.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-[#F7F8FA]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#17212F]">
                      {rep.referenceNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#17212F] block max-w-xs truncate">
                        {rep.issue.title}
                      </span>
                      <span className="text-[10px] text-[#5B6573]">{rep.approximateRegion || "India"}</span>
                    </td>
                    <td className="py-3 px-4 text-[#5B6573]">
                      {rep.user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F8FA] border border-[#E1E5EB] text-[#172B4D]">
                        {rep.complaintStatus}
                      </span>
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
                      {rep.evidence.length > 0 ? (
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
                        className="inline-flex items-center gap-1 rounded bg-[#2457D6] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#1B44AA]"
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
                <span className="font-mono text-xs font-bold text-[#172B4D]">
                  {selectedReport.referenceNumber}
                </span>
                <h3 className="text-base font-bold text-[#17212F] mt-0.5">
                  Moderator Review: {selectedReport.summary}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-[#5B6573] hover:text-[#17212F] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Private Details */}
            <div className="rounded-lg bg-[#F7F8FA] p-4 text-xs space-y-2 border border-[#E1E5EB]">
              <div className="grid grid-cols-2 gap-2 text-[#5B6573]">
                <div>Reporter Email: <strong className="text-[#17212F]">{selectedReport.user.email}</strong></div>
                <div>Region: <strong className="text-[#17212F]">{selectedReport.approximateRegion || "Unspecified"}</strong></div>
                <div>Promised Date: <strong className="text-[#17212F]">{format(new Date(selectedReport.promisedDeliveryDate), "MMM d, yyyy")}</strong></div>
                <div>Order Status: <strong className="text-[#17212F]">{selectedReport.orderStatus}</strong></div>
              </div>
              <div className="pt-2 border-t border-[#E1E5EB]">
                <span className="text-[#5B6573] block mb-1">Full Description:</span>
                <p className="text-[#17212F] whitespace-pre-wrap">{selectedReport.description}</p>
              </div>
            </div>

            {/* Evidence details */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#17212F]">
                Attached Evidence Files ({selectedReport.evidence.length})
              </h4>
              {selectedReport.evidence.length === 0 ? (
                <p className="text-xs text-[#5B6573] italic">No evidence attached to this report.</p>
              ) : (
                <div className="space-y-2">
                  {selectedReport.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="rounded-lg border border-[#E1E5EB] p-3 text-xs flex items-center justify-between bg-white"
                    >
                      <div>
                        <span className="font-mono font-semibold text-[#17212F]">{ev.fileName}</span>
                        <div className="text-[10px] text-[#5B6573] mt-0.5">
                          {ev.fileType} • {Math.round(ev.fileSize / 1024)} KB • Redaction: {ev.redactionStatus}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#087E8B] uppercase">
                        {ev.reviewStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Moderator Note */}
            <div>
              <label className="block text-xs font-semibold text-[#17212F] mb-1">
                Moderation Reason / Audit Note *
              </label>
              <textarea
                rows={3}
                placeholder="State the factual basis for verifying or rejecting this grievance..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="w-full rounded-lg border border-[#E1E5EB] p-2.5 text-xs text-[#17212F]"
              ></textarea>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#E1E5EB] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleModerationAction("FLAG_DUPLICATE")}
                  className="rounded-lg border border-[#E1E5EB] px-3 py-1.5 text-xs font-medium text-[#5B6573] hover:bg-[#F7F8FA]"
                >
                  Flag Duplicate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleVerificationReview("REJECTED")}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 px-4 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FEE4E2]"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleVerificationReview("VERIFIED")}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#18794E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#125838]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verify Evidence</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
