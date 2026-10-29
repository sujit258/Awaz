"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle2,
  ArrowRight,
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
  promisedDeliveryDate: string;
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

export default function MyReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [authRes, reportsRes] = await Promise.all([
          fetch("/api/v1/auth/me"),
          fetch("/api/v1/my-reports"),
        ]);

        if (active) {
          if (authRes.ok) {
            const authData = await authRes.json();
            setUser(authData.user);
          }
          if (reportsRes.ok) {
            const data = await reportsRes.json();
            setReports(data.reports || []);
          }
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
  }, []);

  async function reloadReports() {
    try {
      const reportsRes = await fetch("/api/v1/my-reports");
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
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
        const data = await res.json();
        setStatusMessage(data.error || "Failed to update report status.");
      }
    } catch {
      setStatusMessage("Network error updating report.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-[#5B6573] animate-pulse">
        Loading your complaint reports...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#17212F]">Please Sign In</h2>
        <p className="text-xs text-[#5B6573]">
          You must be signed in to view and manage your submitted reports.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17212F]">
            My Complaint Reports
          </h1>
          <p className="text-xs text-[#5B6573] mt-1">
            Track and update your reported issues for {user.email}
          </p>
        </div>

        <Link
          href="/report"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1B44AA]"
        >
          <span>Report Another Issue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 p-3 text-xs text-[#18794E]">
          {statusMessage}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-white p-12 text-center space-y-3">
          <FileText className="mx-auto h-8 w-8 text-[#5B6573]" />
          <h3 className="text-base font-semibold text-[#17212F]">No Reports Filed Yet</h3>
          <p className="text-xs text-[#5B6573] max-w-sm mx-auto">
            You haven’t submitted any complaint reports. If an order has passed its promised delivery date, report it to make it visible.
          </p>
          <div className="pt-2">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white"
            >
              Submit Your First Report
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E1E5EB] pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-[#17212F] bg-[#F7F8FA] border border-[#E1E5EB] px-2 py-0.5 rounded">
                    {report.referenceNumber}
                  </span>
                  <Link
                    href={`/issues/${report.issue.slug}`}
                    className="text-xs font-semibold text-[#2457D6] hover:underline"
                  >
                    {report.issue.title}
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  {/* Verification Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      report.verificationStatus === "VERIFIED"
                        ? "bg-[#EDF7F1] text-[#18794E]"
                        : report.verificationStatus === "EVIDENCE_SUBMITTED"
                        ? "bg-[#FEF7E6] text-[#946200]"
                        : report.verificationStatus === "REJECTED"
                        ? "bg-[#FEF3F2] text-[#B42318]"
                        : "bg-[#F7F8FA] text-[#5B6573] border border-[#E1E5EB]"
                    }`}
                  >
                    Verification: {report.verificationStatus}
                  </span>

                  {/* Complaint Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      report.complaintStatus === "RESOLVED_BY_CUSTOMER"
                        ? "bg-[#EDF7F1] text-[#18794E]"
                        : "bg-[#F7F8FA] text-[#172B4D] border border-[#E1E5EB]"
                    }`}
                  >
                    Status: {report.complaintStatus}
                  </span>
                </div>
              </div>

              {/* Summary & Description */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#17212F]">{report.summary}</h3>
                <p className="text-xs text-[#5B6573] leading-relaxed whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>

              {/* Evidence Section */}
              <div className="rounded-lg bg-[#F7F8FA] p-3 border border-[#E1E5EB] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#17212F]">Attached Evidence Documents:</span>
                  <span className="text-[#5B6573]">
                    {report.evidence.length} file{report.evidence.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {report.evidence.length === 0 ? (
                  <p className="text-[#5B6573] italic">No evidence uploaded yet (unverified status).</p>
                ) : (
                  <div className="space-y-1">
                    {report.evidence.map((ev) => (
                      <div key={ev.id} className="flex items-center justify-between py-1 border-t border-[#E1E5EB]/60">
                        <span className="font-mono text-[11px] text-[#17212F]">{ev.fileName}</span>
                        <span className="text-[10px] uppercase font-bold text-[#087E8B]">
                          {ev.reviewStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Citizen Actions: Update Delivery & Resolution Status */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E1E5EB]">
                <span className="text-[11px] text-[#5B6573]">
                  Submitted {format(new Date(report.createdAt), "MMM d, yyyy")}
                </span>

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
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#18794E] px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#125838] transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Mark Delivered & Resolved</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#18794E]">
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
