"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Trash2,
  Check,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Lock,
} from "lucide-react";
import { OwnerReportDTO, PublicReportDTO } from "@/lib/dto/report";

function TrackContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";
  const initialKey = searchParams.get("key") || "";

  const [refInput, setRefInput] = useState(initialRef);
  const [keyInput, setKeyInput] = useState(initialKey);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [publicReport, setPublicReport] = useState<PublicReportDTO | null>(null);
  const [ownerReport, setOwnerReport] = useState<OwnerReportDTO | null>(null);

  // Resolution status update state
  const [newStatus, setNewStatus] = useState<string>("RESOLVED_BY_CUSTOMER");
  const [resolutionOutcome, setResolutionOutcome] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Deletion modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);

  const lookupReport = useCallback(async (refToLookup?: string, keyToLookup?: string) => {
    const ref = (refToLookup ?? refInput).trim();
    const key = (keyToLookup ?? keyInput).trim();

    if (!ref) {
      setErrorMsg("Please enter a valid complaint reference number (e.g. AWZ-2026-X89J).");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setUpdateSuccess(false);

    try {
      const headers: Record<string, string> = {};
      if (key) {
        headers["x-awaz-access-key"] = key;
      }

      const res = await fetch(`/api/v1/reports/track?ref=${encodeURIComponent(ref)}`, {
        headers,
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to locate report.");
        setPublicReport(null);
        setOwnerReport(null);
        return;
      }

      if (data.isAuthorized && data.report) {
        setOwnerReport(data.report);
        setPublicReport(null);
      } else {
        setPublicReport(data.publicReport);
        setOwnerReport(null);
        if (data.error) {
          setErrorMsg(data.error);
        }
      }
    } catch {
      setErrorMsg("A network error occurred while connecting to the tracking service.");
    } finally {
      setLoading(false);
    }
  }, [refInput, keyInput]);

  useEffect(() => {
    let ignore = false;

    // Redact key from browser URL bar to prevent history leaks
    if (typeof window !== "undefined" && window.location.search.includes("key=")) {
      const cleanUrl = window.location.pathname + (initialRef ? `?ref=${encodeURIComponent(initialRef)}` : "");
      window.history.replaceState(null, "", cleanUrl);
    }

    if (initialRef) {
      const fetchInitial = async () => {
        try {
          const headers: Record<string, string> = {};
          if (initialKey) {
            headers["x-awaz-access-key"] = initialKey;
          }
          const res = await fetch(`/api/v1/reports/track?ref=${encodeURIComponent(initialRef)}`, {
            headers,
          });
          const data = await res.json();
          if (ignore) return;
          if (res.ok) {
            if (data.isAuthorized && data.report) {
              setOwnerReport(data.report);
            } else if (data.publicReport) {
              setPublicReport(data.publicReport);
            }
          }
        } catch {
          // Handled silently
        }
      };
      fetchInitial();
    }
    return () => {
      ignore = true;
    };
  }, [initialRef, initialKey]);

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerReport) return;

    setUpdating(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (keyInput) {
        headers["x-awaz-access-key"] = keyInput;
      }

      const res = await fetch(`/api/v1/reports/${ownerReport.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          complaintStatus: newStatus,
          resolutionOutcome: resolutionOutcome || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update report status.");
      } else {
        setOwnerReport(data.report);
        setUpdateSuccess(true);
      }
    } catch {
      setErrorMsg("Failed to connect to the server to update status.");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteReport() {
    if (!ownerReport) return;

    setDeleting(true);
    setErrorMsg(null);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (keyInput) {
        headers["x-awaz-access-key"] = keyInput;
      }

      const res = await fetch(`/api/v1/reports/${ownerReport.id}`, {
        method: "DELETE",
        headers,
        body: JSON.stringify({
          confirmDeletion: true,
          reason: "Reporter requested voluntary withdrawal and evidence purge",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to withdraw report.");
      } else {
        setDeletedSuccess(true);
        setShowDeleteConfirm(false);
        setOwnerReport(null);
        setPublicReport(null);
      }
    } catch {
      setErrorMsg("Failed to process withdrawal request.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>Citizen Self-Service Terminal</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#17212F] tracking-tight">
          Track &amp; Manage Your Report
        </h1>
        <p className="text-sm text-[#5B6573] leading-relaxed max-w-2xl">
          Enter your reference code to view progress. Provide your secret access key to unlock full management,
          mark confirmed delivery/refund, or permanently purge your record.
        </p>
      </div>

      {/* Lookup Terminal Card */}
      <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupReport();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#17212F] mb-1.5">
                Reference Code *
              </label>
              <input
                type="text"
                required
                placeholder="AWZ-2026-X89J"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] px-4 py-2.5 text-sm font-mono text-[#17212F] focus:bg-white focus:border-[#2457D6] focus:outline-none transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#5B6573] mb-1.5">
                Secret Access Key (Optional for Management)
              </label>
              <input
                type="password"
                placeholder="awaz_ak_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] px-4 py-2.5 text-sm font-mono text-[#17212F] focus:bg-white focus:border-[#2457D6] focus:outline-none transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[#5B6573]">
              Reference code displays public verification status. Key authorizes private details and resolution updates.
            </span>
            <button
              type="submit"
              disabled={loading || !refInput.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2457D6] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] disabled:opacity-50 transition-colors shrink-0"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? "Searching..." : "Lookup Report"}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="rounded-xl bg-[#FEF3F2] border border-[#B42318]/20 p-4 text-xs text-[#B42318] flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Deleted Confirmation State */}
      {deletedSuccess && (
        <div className="rounded-2xl border border-[#18794E]/20 bg-[#EDF7F1] p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#18794E] shadow-xs">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#17212F]">Report Successfully Withdrawn</h2>
          <p className="text-xs text-[#5B6573] max-w-md mx-auto leading-relaxed">
            Your complaint report has been withdrawn from publication, all attached evidence files have been purged from storage, and personal identifiers scrubbed under our published data retention charter.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2457D6] hover:underline"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* AUTHORIZED OWNER VIEW */}
      {ownerReport && (
        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E1E5EB] gap-3">
            <div>
              <span className="text-[11px] font-mono text-[#5B6573] uppercase tracking-wider">
                Authorized Complaint Dossier
              </span>
              <h2 className="text-2xl font-extrabold font-mono text-[#17212F] mt-0.5">
                {ownerReport.referenceNumber}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-bold bg-[#EDF7F1] text-[#18794E] border border-[#18794E]/20">
                {ownerReport.verificationStatus}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[#F7F8FA] text-[#5B6573] border border-[#E1E5EB]">
                {ownerReport.complaintStatus}
              </span>
            </div>
          </div>

          {/* Structured Lifecycle Progress Stepper */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5B6573]">
              Fulfillment &amp; Verification Lifecycle
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#EDF7F1] border border-[#18794E]/20 space-y-1">
                <span className="font-bold text-[#18794E] flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" />
                  1. Logged
                </span>
                <p className="text-[11px] text-[#5B6573]">Factual timeline recorded</p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                ownerReport.evidence.length > 0
                  ? "bg-[#EDF7F1] border-[#18794E]/20 text-[#18794E]"
                  : "bg-[#F7F8FA] border-[#E1E5EB] text-[#5B6573]"
              }`}>
                <span className="font-bold flex items-center gap-1">
                  {ownerReport.evidence.length > 0 ? <Check className="h-3.5 w-3.5" /> : null}
                  2. Evidence
                </span>
                <p className="text-[11px] text-[#5B6573]">
                  {ownerReport.evidence.length > 0 ? `${ownerReport.evidence.length} file attached` : "Voluntary/Pending"}
                </p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                ownerReport.verificationStatus === "VERIFIED"
                  ? "bg-[#EDF7F1] border-[#18794E]/20 text-[#18794E]"
                  : "bg-[#F7F8FA] border-[#E1E5EB] text-[#5B6573]"
              }`}>
                <span className="font-bold">
                  3. Screening
                </span>
                <p className="text-[11px] text-[#5B6573]">{ownerReport.verificationStatus}</p>
              </div>

              <div className={`p-3 rounded-xl border space-y-1 ${
                ownerReport.complaintStatus === "RESOLVED_BY_CUSTOMER"
                  ? "bg-[#EDF7F1] border-[#18794E]/20 text-[#18794E]"
                  : "bg-[#F7F8FA] border-[#E1E5EB] text-[#5B6573]"
              }`}>
                <span className="font-bold">
                  4. Outcome
                </span>
                <p className="text-[11px] text-[#5B6573]">
                  {ownerReport.complaintStatus === "RESOLVED_BY_CUSTOMER" ? "Resolved by citizen" : "Awaiting delivery"}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-[#F7F8FA] p-4 rounded-xl border border-[#E1E5EB]">
            <div>
              <span className="text-[#5B6573] block">Issue Scope:</span>
              <p className="font-bold text-[#17212F] mt-0.5">{ownerReport.issueTitle}</p>
            </div>
            <div>
              <span className="text-[#5B6573] block">Carrier Status:</span>
              <p className="font-bold text-[#17212F] mt-0.5">{ownerReport.orderStatus}</p>
            </div>
            <div>
              <span className="text-[#5B6573] block">Promised Date:</span>
              <p className="font-bold text-[#17212F] mt-0.5">
                {ownerReport.promisedDeliveryDate ? new Date(ownerReport.promisedDeliveryDate).toLocaleDateString() : "Not specified"}
              </p>
            </div>
            <div>
              <span className="text-[#5B6573] block">Logged On:</span>
              <p className="font-bold text-[#17212F] mt-0.5">
                {new Date(ownerReport.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Private Description (Only accessible with key/auth) */}
          <div className="rounded-xl bg-white border border-[#E1E5EB] p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-[#17212F]">
              <Lock className="h-4 w-4 text-[#2457D6]" />
              <span>Private Narrative (Protected from Public)</span>
            </div>
            <p className="text-[#17212F] whitespace-pre-wrap leading-relaxed">
              {ownerReport.description}
            </p>
          </div>

          {/* Evidence List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#17212F]">
              Attached Evidence ({ownerReport.evidence.length})
            </h3>
            {ownerReport.evidence.length === 0 ? (
              <p className="text-xs text-[#5B6573] italic">No evidence attached to this report.</p>
            ) : (
              <div className="space-y-2">
                {ownerReport.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-[#E1E5EB] bg-white text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-[#087E8B]" />
                      <div>
                        <p className="font-bold text-[#17212F]">{ev.fileName}</p>
                        <span className="text-[11px] text-[#5B6573]">
                          {Math.round(ev.fileSize / 1024)} KB · Review: {ev.reviewStatus}
                        </span>
                      </div>
                    </div>
                    <a
                      href={`/api/v1/evidence/${ev.id}?download=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F7F8FA] border border-[#E1E5EB] text-[11px] font-bold text-[#17212F] hover:bg-[#EAECEF]"
                    >
                      <span>Download File</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Resolution Status Form */}
          <div className="pt-6 border-t border-[#E1E5EB] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#17212F]">Update Resolution Status</h3>
              <p className="text-xs text-[#5B6573] mt-0.5">
                Has the package been delivered or a refund credited? Updating status directly informs our public resolution metrics.
              </p>
            </div>

            {updateSuccess && (
              <div className="rounded-xl bg-[#EDF7F1] border border-[#18794E]/20 p-3.5 text-xs text-[#18794E] flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span className="font-semibold">Resolution status updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="rounded-xl border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#17212F] focus:border-[#2457D6] focus:outline-none"
                >
                  <option value="RESOLVED_BY_CUSTOMER">Package Delivered / Refund Credited</option>
                  <option value="DISPUTED">Disputed / Support Unresponsive</option>
                  <option value="OPEN">Still Awaiting Delivery Fulfillment</option>
                </select>

                <input
                  type="text"
                  maxLength={300}
                  placeholder="Outcome details (e.g. Delivered on Oct 29, replacement received)..."
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="rounded-xl border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-xs text-[#17212F] focus:border-[#2457D6] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B42318] hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Withdraw / Purge Complaint</span>
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-[#2457D6] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="rounded-2xl border border-[#B42318]/30 bg-[#FEF3F2] p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#B42318]">
                <AlertCircle className="h-4 w-4" />
                <span>Confirm Permanent Complaint Withdrawal</span>
              </div>
              <p className="text-xs text-[#B42318]/90 leading-relaxed">
                Withdrawing this complaint permanently deletes all attached evidence files and removes your report from public counting. This action is irreversible.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-[#E1E5EB] bg-white px-4 py-2 text-xs font-semibold text-[#17212F] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteReport}
                  className="rounded-xl bg-[#B42318] px-5 py-2 text-xs font-bold text-white hover:bg-[#912018] disabled:opacity-50"
                >
                  {deleting ? "Purging..." : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PUBLIC OVERVIEW ONLY (Without Secret Key) */}
      {publicReport && !ownerReport && (
        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E1E5EB]">
            <div>
              <span className="text-[11px] font-mono text-[#5B6573] uppercase tracking-wider">
                Public Reference Code:
              </span>
              <h2 className="text-xl font-bold font-mono text-[#17212F] mt-0.5">
                {publicReport.referenceNumber}
              </h2>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-bold bg-[#EDF7F1] text-[#18794E] border border-[#18794E]/20">
              {publicReport.verificationStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-[#F7F8FA] p-4 rounded-xl border border-[#E1E5EB]">
            <div>
              <span className="text-[#5B6573] block">Issue Category:</span>
              <p className="font-bold text-[#17212F] mt-0.5">{publicReport.issueTitle}</p>
            </div>
            <div>
              <span className="text-[#5B6573] block">Fulfillment State:</span>
              <p className="font-bold text-[#17212F] mt-0.5">{publicReport.orderStatus}</p>
            </div>
            <div>
              <span className="text-[#5B6573] block">Logged On:</span>
              <p className="font-bold text-[#17212F] mt-0.5">
                {new Date(publicReport.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Access Key Prompt for Full Management */}
          <div className="rounded-xl bg-[#FFFBEB] border border-[#D97706]/30 p-5 text-xs space-y-2 text-[#78350F]">
            <div className="flex items-center gap-2 font-bold text-[#92400E]">
              <KeyRound className="h-4 w-4" />
              <span>Public Read-Only Mode Active</span>
            </div>
            <p className="leading-relaxed">
              This is the non-sensitive public record. To view your private description, download attached evidence, or update the resolution status, enter your <strong>Secret Access Key</strong> in the lookup bar above.
            </p>
          </div>
        </div>
      )}

      {/* Official Government Recourse (Next Steps) Card */}
      <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#17212F]">
          <HelpCircle className="h-4 w-4 text-[#087E8B]" />
          <span>Recommended Next Steps &amp; Statutory Recourse (India)</span>
        </div>
        <p className="text-xs text-[#5B6573] leading-relaxed">
          While Awaz aggregates consumer proof publicly, if your shipment is significantly past its delivery SLA, you can initiate formal grievance resolution directly through verified national platforms:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <a
            href="https://consumerhelpline.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] hover:bg-[#EFF4FF] hover:border-[#2457D6]/30 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-[#17212F] group-hover:text-[#2457D6] block">
                National Consumer Helpline (NCH)
              </span>
              <span className="text-[11px] text-[#5B6573]">
                Toll Free 1915 or online portal mediation
              </span>
            </div>
            <ExternalLink className="h-4 w-4 text-[#5B6573] group-hover:text-[#2457D6]" />
          </a>

          <a
            href="https://e-jagriti.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] hover:bg-[#EFF4FF] hover:border-[#2457D6]/30 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="font-bold text-[#17212F] group-hover:text-[#2457D6] block">
                e-Jagriti Consumer Commission
              </span>
              <span className="text-[11px] text-[#5B6573]">
                Statutory District/State Commission filing
              </span>
            </div>
            <ExternalLink className="h-4 w-4 text-[#5B6573] group-hover:text-[#2457D6]" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-xs text-[#5B6573]">Loading tracking view...</div>}>
      <TrackContent />
    </Suspense>
  );
}
