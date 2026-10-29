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
      setErrorMsg("Please enter a valid reference number.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setUpdateSuccess(false);

    try {
      let url = `/api/v1/reports/track?ref=${encodeURIComponent(ref)}`;
      if (key) {
        url += `&accessKey=${encodeURIComponent(key)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to look up report.");
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
    if (initialRef) {
      const fetchInitial = async () => {
        try {
          let url = `/api/v1/reports/track?ref=${encodeURIComponent(initialRef)}`;
          if (initialKey) url += `&accessKey=${encodeURIComponent(initialKey)}`;
          const res = await fetch(url);
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
          // Handled silently on initial load
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
          reason: "Reporter requested withdrawal and evidence purge",
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
      setErrorMsg("Failed to process deletion request.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E] mb-3 border border-[#18794E]/20">
          <Shield className="h-3.5 w-3.5" />
          <span>Independent Consumer Rights</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17212F]">
          Track &amp; Manage Your Report
        </h1>
        <p className="text-xs sm:text-sm text-[#5B6573] mt-1.5">
          Look up report progress using your reference code. Provide your secret access key to update resolution or withdraw.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookupReport();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#17212F] mb-1">
                Reference Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AWZ-2026-X89J"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-sm font-mono text-[#17212F] focus:border-[#2457D6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                Anonymous Access Key (Optional)
              </label>
              <input
                type="password"
                placeholder="awaz_ak_..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-sm font-mono text-[#17212F] focus:border-[#2457D6]"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-[#5B6573]">
              A reference number displays non-sensitive status. An access key authorizes full management.
            </span>
            <button
              type="submit"
              disabled={loading || !refInput.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              <span>{loading ? "Searching..." : "Lookup Report"}</span>
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-3.5 text-xs text-[#B42318] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Deleted Confirmation State */}
      {deletedSuccess && (
        <div className="rounded-xl border border-[#18794E]/20 bg-[#EDF7F1] p-6 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#18794E]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#17212F]">Report Successfully Withdrawn</h2>
          <p className="text-xs text-[#5B6573] max-w-md mx-auto">
            Your complaint report has been withdrawn from publication, all attached evidence files have been purged from storage, and personal identifiers have been scrubbed in compliance with data retention standards.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457D6] hover:underline"
            >
              <span>Return to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* AUTHORIZED OWNER VIEW */}
      {ownerReport && (
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E1E5EB] gap-2">
            <div>
              <span className="text-xs font-mono text-[#5B6573]">Reference Code:</span>
              <h2 className="text-xl font-bold font-mono text-[#17212F]">
                {ownerReport.referenceNumber}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[#EDF7F1] text-[#18794E] border border-[#18794E]/20">
                {ownerReport.verificationStatus}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-medium bg-[#F7F8FA] text-[#5B6573] border border-[#E1E5EB]">
                {ownerReport.complaintStatus}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#5B6573]">Issue Category:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">{ownerReport.issueTitle}</p>
            </div>
            <div>
              <span className="text-[#5B6573]">Shipment Status:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">{ownerReport.orderStatus}</p>
            </div>
            <div>
              <span className="text-[#5B6573]">Promised Date:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">
                {ownerReport.promisedDeliveryDate ? new Date(ownerReport.promisedDeliveryDate).toLocaleDateString() : "Not specified"}
              </p>
            </div>
            <div>
              <span className="text-[#5B6573]">Submitted:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">
                {new Date(ownerReport.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Private Description (Only accessible with key/auth) */}
          <div className="rounded-lg bg-[#F7F8FA] border border-[#E1E5EB] p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#17212F]">
              <FileText className="h-4 w-4 text-[#2457D6]" />
              <span>Your Private Description</span>
            </div>
            <p className="text-[#17212F] whitespace-pre-wrap leading-relaxed">
              {ownerReport.description}
            </p>
          </div>

          {/* Evidence List */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#17212F] mb-2">
              Attached Private Evidence ({ownerReport.evidence.length})
            </h3>
            {ownerReport.evidence.length === 0 ? (
              <p className="text-xs text-[#5B6573]">No evidence attached to this complaint.</p>
            ) : (
              <div className="space-y-2">
                {ownerReport.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E1E5EB] bg-white text-xs"
                  >
                    <div>
                      <p className="font-medium text-[#17212F]">{ev.fileName}</p>
                      <span className="text-[11px] text-[#5B6573]">
                        {Math.round(ev.fileSize / 1024)} KB · {ev.reviewStatus}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#18794E] bg-[#EDF7F1] px-2 py-0.5 rounded">
                      Private &amp; Protected
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Update Resolution Status Form */}
          <div className="pt-4 border-t border-[#E1E5EB] space-y-3">
            <h3 className="text-sm font-bold text-[#17212F]">Update Resolution Status</h3>
            <p className="text-xs text-[#5B6573]">
              Has Flipkart delivered the package or processed a refund? Marking resolved updates our public aggregate stats.
            </p>

            {updateSuccess && (
              <div className="rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 p-3 text-xs text-[#18794E] flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Resolution status updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleStatusUpdate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-2 text-xs text-[#17212F] focus:border-[#2457D6]"
                >
                  <option value="RESOLVED_BY_CUSTOMER">Delivered / Resolved by Customer</option>
                  <option value="DISPUTED">Disputed / Unresponsive Support</option>
                  <option value="OPEN">Still Open &amp; Awaiting Fulfillment</option>
                </select>

                <input
                  type="text"
                  maxLength={300}
                  placeholder="Resolution notes (e.g. Delivered on Oct 29, refund credited)"
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-2 text-xs text-[#17212F] focus:border-[#2457D6]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B42318] hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Withdraw / Delete Report</span>
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1B44AA] disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="rounded-xl border border-[#B42318]/30 bg-[#FEF3F2] p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#B42318]">
                <AlertCircle className="h-4 w-4" />
                <span>Confirm Report Withdrawal &amp; Evidence Deletion</span>
              </div>
              <p className="text-xs text-[#B42318]/90 leading-relaxed">
                Withdrawing this complaint will permanently remove all attached evidence files and scrub your text description. This action is irreversible.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#17212F] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDeleteReport}
                  className="rounded-lg bg-[#B42318] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#912018] disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Confirm Withdrawal"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PUBLIC OVERVIEW ONLY (Without Secret Key) */}
      {publicReport && !ownerReport && (
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1E5EB]">
            <div>
              <span className="text-[11px] font-mono text-[#5B6573]">Reference Code:</span>
              <h2 className="text-lg font-bold font-mono text-[#17212F]">
                {publicReport.referenceNumber}
              </h2>
            </div>
            <span className="rounded-full px-3 py-1 text-xs font-semibold bg-[#EDF7F1] text-[#18794E] border border-[#18794E]/20">
              {publicReport.verificationStatus}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#5B6573]">Issue Category:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">{publicReport.issueTitle}</p>
            </div>
            <div>
              <span className="text-[#5B6573]">Order Status:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">{publicReport.orderStatus}</p>
            </div>
            <div>
              <span className="text-[#5B6573]">Logged Date:</span>
              <p className="font-semibold text-[#17212F] mt-0.5">
                {new Date(publicReport.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Access Key Prompt for Management */}
          <div className="rounded-lg bg-[#FFFBEB] border border-[#D97706]/30 p-4 text-xs space-y-2 text-[#78350F]">
            <div className="flex items-center gap-2 font-semibold text-[#92400E]">
              <KeyRound className="h-4 w-4" />
              <span>Public Overview Mode</span>
            </div>
            <p>
              This is an anonymized public view. To view private complaint details, mark the order resolved, or request deletion, enter the <strong>Anonymous Access Key</strong> issued during submission in the field above.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-[#5B6573]">Loading tracking view...</div>}>
      <TrackContent />
    </Suspense>
  );
}
