"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Upload,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Eye,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { IndianRegions } from "@/lib/validation/schemas";

interface IssueOption {
  id: string;
  slug: string;
  title: string;
  category: string;
}

export default function ReportPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [issues, setIssues] = useState<IssueOption[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(true);

  // Form State
  const [issueId, setIssueId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [promisedDeliveryDate, setPromisedDeliveryDate] = useState("");
  const [orderStatus, setOrderStatus] = useState<"AWAITING_DELIVERY" | "DELIVERED" | "CANCELLED" | "UNKNOWN">("AWAITING_DELIVERY");
  const [hasMeaningfulUpdate, setHasMeaningfulUpdate] = useState(false);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [resolutionOutcome, setResolutionOutcome] = useState("");
  const [approximateRegion, setApproximateRegion] = useState("Other / Not Specified");
  const [orderReference, setOrderReference] = useState("");

  // Evidence state
  const [evidenceFile, setEvidenceFile] = useState<{
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
  const [redactionConfirmed, setRedactionConfirmed] = useState(false);

  // Consent & Legal
  const [confirmationAccurate, setConfirmationAccurate] = useState(false);
  const [confirmationConsent, setConfirmationConsent] = useState(false);

  // Optional Auth state
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showOptionalAuth, setShowOptionalAuth] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Submission result state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    referenceNumber: string;
    id: string;
    verificationStatus: string;
    issueSlug: string;
    accessKey?: string;
    isAnonymous: boolean;
  } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [issuesRes, authRes] = await Promise.all([
          fetch("/api/v1/issues"),
          fetch("/api/v1/auth/me"),
        ]);
        if (issuesRes.ok) {
          const data = await issuesRes.json();
          setIssues(data.issues || []);
          if (data.issues && data.issues.length > 0) {
            setIssueId(data.issues[0].id);
          }
        }
        if (authRes.ok) {
          const authData = await authRes.json();
          setUser(authData.user);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingIssues(false);
      }
    }
    init();
  }, []);

  async function handleInlineAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      let res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      if (!res.ok) {
        res = await fetch("/api/v1/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed.");
      } else {
        setUser(data.user);
        setShowOptionalAuth(false);
      }
    } catch {
      setAuthError("Failed to connect to authentication service.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size cannot exceed 10MB.");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a JPEG, PNG, WEBP image or a PDF document.");
      return;
    }

    setEvidenceFile({
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });
  }

  async function handleSubmitComplaint() {
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const idempotencyKey = `AWZ-IDEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const payload = {
        companyId: "flipkart",
        issueId,
        orderDate: orderDate || null,
        promisedDeliveryDate: promisedDeliveryDate || null,
        orderStatus,
        hasMeaningfulUpdate,
        summary: summary || null,
        description,
        resolutionOutcome: resolutionOutcome || null,
        approximateRegion: approximateRegion !== "Other / Not Specified" ? approximateRegion : null,
        orderReference: orderReference || null,
        idempotencyKey,
        confirmationAccurate,
        confirmationConsent,
      };

      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit report. Please review your entries.");
        setSubmitting(false);
        return;
      }

      // If user attached evidence metadata, save it now with anonymous access key if present
      if (evidenceFile && data.report?.id) {
        try {
          const evidenceHeaders: Record<string, string> = { "Content-Type": "application/json" };
          if (data.accessKey) {
            evidenceHeaders["x-awaz-access-key"] = data.accessKey;
          }

          await fetch(`/api/v1/reports/${data.report.id}/evidence`, {
            method: "POST",
            headers: evidenceHeaders,
            body: JSON.stringify({
              fileName: evidenceFile.fileName,
              fileType: evidenceFile.fileType,
              fileSize: evidenceFile.fileSize,
              redactionConfirmed,
            }),
          });
        } catch (evErr) {
          console.error("Evidence attachment error:", evErr);
        }
      }

      setSubmissionResult({
        ...data.report,
        accessKey: data.accessKey,
      });
      setStep(5);
    } catch {
      setErrorMsg("An unexpected network error occurred while submitting your complaint.");
    } finally {
      setSubmitting(false);
    }
  }

  function copyAccessKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Privacy Notice Banner */}
      <div className="mb-6 rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 p-3.5 text-xs text-[#18794E] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 shrink-0 text-[#18794E]" />
          <span>
            <strong>Privacy-First Reporting:</strong> No account or email is required. Private identifiers are never shared publicly.
          </span>
        </div>
        <Link href="/privacy" className="text-xs font-semibold underline shrink-0 hover:text-[#125838]">
          Privacy Charter
        </Link>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-[#5B6573] mb-2">
          <span>
            Step {step} of 5:{" "}
            {step === 1
              ? "Issue Category"
              : step === 2
              ? "Your Factual Experience"
              : step === 3
              ? "Supporting Evidence (Optional)"
              : step === 4
              ? "Review & Submit"
              : "Confirmation & Access Key"}
          </span>
          <span>{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="h-1.5 w-full bg-[#E1E5EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2457D6] transition-all duration-300"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs">
        {/* STEP 1: Issue Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#17212F]">Step 1: Order & Issue Category</h2>
              <p className="text-xs text-[#5B6573] mt-1">
                Select the grievance category. Specific dates are completely optional.
              </p>
            </div>

            <div className="space-y-4">
              {/* Company */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                  Target Company / Platform
                </label>
                <input
                  type="text"
                  disabled
                  value="Flipkart (India)"
                  className="w-full rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] px-3.5 py-2.5 text-sm text-[#17212F] font-medium"
                />
                <span className="text-[11px] text-[#5B6573] mt-1 block">
                  Awaz is currently documenting Flipkart fulfillment and delivery disputes across India.
                </span>
              </div>

              {/* Issue Category */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17212F] mb-1">
                  Primary Issue Category *
                </label>
                {loadingIssues ? (
                  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
                ) : (
                  <select
                    value={issueId}
                    onChange={(e) => setIssueId(e.target.value)}
                    className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-sm text-[#17212F] focus:border-[#2457D6] focus:ring-1 focus:ring-[#2457D6]"
                  >
                    {issues.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Delivery Dates (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                    Promised Delivery Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={promisedDeliveryDate}
                    onChange={(e) => setPromisedDeliveryDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2 text-sm text-[#17212F] focus:border-[#2457D6]"
                  />
                  <span className="text-[11px] text-[#5B6573] mt-0.5 block">
                    Helps calculate delay duration. Leave blank if unsure.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                    Order Placement Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2 text-sm text-[#17212F] focus:border-[#2457D6]"
                  />
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#17212F] mb-1">
                  Current Status of Shipment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: "AWAITING_DELIVERY", label: "Awaiting Delivery" },
                    { value: "DELIVERED", label: "Delivered Late" },
                    { value: "CANCELLED", label: "Cancelled by Seller" },
                    { value: "UNKNOWN", label: "Unknown / Lost" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOrderStatus(opt.value as "AWAITING_DELIVERY" | "DELIVERED" | "CANCELLED" | "UNKNOWN")}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                        orderStatus === opt.value
                          ? "border-[#2457D6] bg-[#2457D6]/5 text-[#2457D6] font-semibold"
                          : "border-[#E1E5EB] hover:bg-[#F7F8FA] text-[#5B6573]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meaningful update received? */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMeaningfulUpdate}
                    onChange={(e) => setHasMeaningfulUpdate(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#E1E5EB] text-[#2457D6] focus:ring-[#2457D6]"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-[#17212F]">
                      Have you received a substantive explanation or revised delivery date from support?
                    </span>
                    <p className="text-[#5B6573]">
                      Check if customer support has communicated a substantive reason or confirmed revised tracking date.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E1E5EB] flex justify-end">
              <button
                type="button"
                disabled={!issueId}
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Describe the Experience */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#17212F]">Step 2: Factual Experience</h2>
              <p className="text-xs text-[#5B6573] mt-1">
                Describe the delivery failure factually. Detailed descriptions are private by default.
              </p>
            </div>

            {/* Strict Privacy Warning */}
            <div className="rounded-lg border border-[#B42318]/20 bg-[#FEF3F2] p-4 text-xs text-[#B42318] flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Data Protection Rule: </strong>
                Do <strong>NOT</strong> include passwords, OTPs, credit/debit card numbers, UPI PINs, exact home addresses, or phone numbers in your text description.
              </div>
            </div>

            <div className="space-y-4">
              {/* Detailed description (Mandatory) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#17212F]">
                    Factual Description * (At least 20 chars)
                  </label>
                  <span className="text-[10px] text-[#5B6573]">{description.length}/2500</span>
                </div>
                <textarea
                  rows={5}
                  required
                  minLength={20}
                  maxLength={2500}
                  placeholder="Describe the timeline, communication attempts, automated responses, or lack of status updates..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-sm text-[#17212F] focus:border-[#2457D6]"
                ></textarea>
                <span className="text-[11px] text-[#5B6573] mt-0.5 block">
                  Raw complaint descriptions remain confidential and are used strictly by reviewers to verify evidence patterns.
                </span>
              </div>

              {/* Short Summary (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573]">
                    Short Headline / Summary (Optional, max 140 chars)
                  </label>
                  <span className="text-[10px] text-[#5B6573]">{summary.length}/140</span>
                </div>
                <input
                  type="text"
                  maxLength={140}
                  placeholder="e.g. Package stalled at courier hub for 5 days with no tracking updates."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2.5 text-sm text-[#17212F] focus:border-[#2457D6]"
                />
                <span className="text-[11px] text-[#5B6573] mt-0.5 block">
                  Leave empty to have a safe automated summary generated from your description.
                </span>
              </div>

              {/* Masked Order Reference (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                  Order Tracking Reference (Optional)
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="e.g. OD123456... (Mask middle numbers)"
                  value={orderReference}
                  onChange={(e) => setOrderReference(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2 text-sm text-[#17212F] focus:border-[#2457D6]"
                />
                <span className="text-[11px] text-[#5B6573] mt-0.5 block">
                  Optional. For verification with courier tracking logs. Never published openly.
                </span>
              </div>

              {/* Region (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                  Approximate State or Union Territory (Optional)
                </label>
                <select
                  value={approximateRegion}
                  onChange={(e) => setApproximateRegion(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2 text-sm text-[#17212F] focus:border-[#2457D6]"
                >
                  {IndianRegions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#5B6573] mt-0.5 block">
                  Used solely to identify broad regional logistics bottlenecks across India.
                </span>
              </div>

              {/* Desired outcome (Optional) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5B6573] mb-1">
                  Desired Resolution (Optional)
                </label>
                <input
                  type="text"
                  maxLength={300}
                  placeholder="e.g. Expedited delivery within 24h or immediate unconditional refund."
                  value={resolutionOutcome}
                  onChange={(e) => setResolutionOutcome(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white px-3.5 py-2 text-sm text-[#17212F] focus:border-[#2457D6]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E1E5EB] flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] px-4 py-2 text-xs font-semibold text-[#5B6573] hover:bg-[#F7F8FA]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={description.trim().length < 20}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
              >
                <span>Continue to Step 3</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Evidence (Optional) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#17212F]">Step 3: Supporting Evidence (Optional)</h2>
              <p className="text-xs text-[#5B6573] mt-1">
                Attach tracking screenshots or order confirmations. Evidence is private and optional.
              </p>
            </div>

            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#17212F]">
                <Lock className="h-4 w-4 text-[#087E8B]" />
                <span>Evidence Privacy Guarantee</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[#5B6573]">
                <li>Evidence files are stored in private, access-controlled object storage.</li>
                <li>Evidence is <strong>never</strong> published openly or indexed on search engines.</li>
                <li>Please blackout or crop out passwords, payment card numbers, and complete addresses.</li>
                <li>Attaching evidence is voluntary; unverified factual reports still contribute to issue statistics.</li>
              </ul>
            </div>

            {/* File upload area */}
            <div className="border-2 border-dashed border-[#E1E5EB] rounded-xl p-6 text-center hover:border-[#2457D6] transition-colors">
              <input
                type="file"
                id="evidence-input"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileSelection}
                className="hidden"
              />
              <label htmlFor="evidence-input" className="cursor-pointer flex flex-col items-center">
                <Upload className="h-8 w-8 text-[#5B6573] mb-2" />
                <span className="text-sm font-semibold text-[#2457D6]">
                  Click to select file (PNG, JPG, WEBP, PDF up to 10MB)
                </span>
                <span className="text-xs text-[#5B6573] mt-1">
                  Order tracking screenshot, delayed notification, or support chat
                </span>
              </label>

              {evidenceFile && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#EDF7F1] border border-[#18794E]/20 px-3.5 py-2 text-xs text-[#18794E] font-medium">
                  <FileCheck className="h-4 w-4" />
                  <span>
                    Selected: {evidenceFile.fileName} ({Math.round(evidenceFile.fileSize / 1024)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setEvidenceFile(null)}
                    className="ml-2 text-xs underline text-[#B42318]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Redaction Confirmation */}
            {evidenceFile && (
              <label className="flex items-start gap-2.5 cursor-pointer rounded-lg border border-[#E1E5EB] p-3.5 bg-white">
                <input
                  type="checkbox"
                  checked={redactionConfirmed}
                  onChange={(e) => setRedactionConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E1E5EB] text-[#2457D6] focus:ring-[#2457D6]"
                />
                <div className="text-xs text-[#17212F]">
                  <span className="font-semibold">I confirm that personal financial and sensitive details are redacted.</span>
                  <p className="text-[#5B6573] mt-0.5">
                    I confirm that I have removed or blacked out passwords, bank cards, full addresses, and unnecessary personal identifiers.
                  </p>
                </div>
              </label>
            )}

            <div className="pt-4 border-t border-[#E1E5EB] flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] px-4 py-2 text-xs font-semibold text-[#5B6573] hover:bg-[#F7F8FA]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={evidenceFile ? !redactionConfirmed : false}
                onClick={() => setStep(4)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
              >
                <span>Continue to Review</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Submit (Sign-in is OPTIONAL) */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#17212F]">Step 4: Review and Submit</h2>
              <p className="text-xs text-[#5B6573] mt-1">
                Verify your factual report. No account or password is required.
              </p>
            </div>

            {/* Factual Summary Card */}
            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-4 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#E1E5EB]">
                <div>
                  <span className="text-[#5B6573]">Platform:</span>
                  <p className="font-semibold text-[#17212F]">Flipkart (India)</p>
                </div>
                <div>
                  <span className="text-[#5B6573]">Promised Date:</span>
                  <p className="font-semibold text-[#17212F]">{promisedDeliveryDate || "Not specified"}</p>
                </div>
                <div>
                  <span className="text-[#5B6573]">Shipment Status:</span>
                  <p className="font-semibold text-[#17212F]">{orderStatus}</p>
                </div>
                <div>
                  <span className="text-[#5B6573]">Region:</span>
                  <p className="font-semibold text-[#17212F]">{approximateRegion}</p>
                </div>
              </div>

              <div>
                <span className="text-[#5B6573]">Factual Description:</span>
                <p className="text-[#17212F] mt-0.5 whitespace-pre-wrap">{description}</p>
              </div>

              <div>
                <span className="text-[#5B6573]">Evidence File:</span>
                <p className="font-medium text-[#17212F] mt-0.5">
                  {evidenceFile ? `${evidenceFile.fileName} (Private & Redacted)` : "None attached (Unverified)"}
                </p>
              </div>
            </div>

            {/* Account Status / Optional Sign-in */}
            {user ? (
              <div className="rounded-lg border border-[#18794E]/20 bg-[#EDF7F1] p-3 text-xs text-[#18794E] flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <UserCheck className="h-4 w-4" />
                  Submitting as registered user: <strong>{user.email}</strong>
                </span>
                <span className="text-[11px] underline">Linked to Account</span>
              </div>
            ) : (
              <div className="rounded-lg border border-[#E1E5EB] bg-white p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-[#17212F]">
                    <Shield className="h-4 w-4 text-[#2457D6]" />
                    <span>Submitting Anonymously (Default)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOptionalAuth(!showOptionalAuth)}
                    className="text-xs font-semibold text-[#2457D6] hover:underline"
                  >
                    {showOptionalAuth ? "Cancel Sign-in" : "Sign in to attach to account (Optional)"}
                  </button>
                </div>
                <p className="text-[#5B6573]">
                  You do not need to create an account. You will receive a secure, one-time Access Key to view status, submit additional evidence, or request deletion at any time.
                </p>

                {showOptionalAuth && (
                  <form onSubmit={handleInlineAuth} className="pt-3 border-t border-[#E1E5EB] space-y-3">
                    {authError && (
                      <div className="text-xs text-[#B42318] bg-[#FEF3F2] p-2 rounded border border-[#B42318]/20">
                        {authError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="email"
                        required
                        placeholder="Your email address"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-2 text-xs text-[#17212F]"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Password (min 8 chars)"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="rounded-lg border border-[#E1E5EB] bg-white px-3 py-2 text-xs text-[#17212F]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={authLoading || !authEmail || authPassword.length < 8}
                      className="rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1B44AA] disabled:opacity-50"
                    >
                      {authLoading ? "Authenticating..." : "Sign in / Register"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Mandatory Certifications */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmationAccurate}
                  onChange={(e) => setConfirmationAccurate(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E1E5EB] text-[#2457D6] focus:ring-[#2457D6]"
                />
                <span className="text-xs text-[#17212F]">
                  <strong>Factual Accuracy Certification: </strong>I certify that the information provided is factually accurate to the best of my knowledge, and I hold legitimate rights to any attached documentation.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmationConsent}
                  onChange={(e) => setConfirmationConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#E1E5EB] text-[#2457D6] focus:ring-[#2457D6]"
                />
                <span className="text-xs text-[#17212F]">
                  <strong>Public Evidence Charter: </strong>I understand that Awaz is an independent non-profit public interest platform. My report will be aggregated anonymously for consumer advocacy, and Awaz does not provide corporate redressal or legal representation.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-3 text-xs text-[#B42318]">
                {errorMsg}
              </div>
            )}

            <div className="pt-4 border-t border-[#E1E5EB] flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E5EB] px-4 py-2 text-xs font-semibold text-[#5B6573] hover:bg-[#F7F8FA]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!confirmationAccurate || !confirmationConsent || submitting}
                onClick={handleSubmitComplaint}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
              >
                <span>
                  {submitting
                    ? "Recording Grievance..."
                    : user
                    ? "Submit Factual Report"
                    : "Submit Report Anonymously"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Real Confirmation & Access Key */}
        {step === 5 && submissionResult && (
          <div className="text-center py-6 space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF7F1] text-[#18794E]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <h2 className="text-2xl font-bold text-[#17212F]">
              Report Successfully Recorded
            </h2>

            <p className="text-xs text-[#5B6573] max-w-md mx-auto leading-relaxed">
              Your grievance has been safely saved and incorporated into our aggregated evidence system under reference standard.
            </p>

            {/* Public Reference Box */}
            <div className="rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] p-4 max-w-sm mx-auto text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5B6573]">Public Reference:</span>
                <span className="font-bold text-[#17212F] tabular-nums font-mono">
                  {submissionResult.referenceNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5B6573]">Initial Status:</span>
                <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold bg-[#EDF7F1] text-[#18794E]">
                  {submissionResult.verificationStatus}
                </span>
              </div>
            </div>

            {/* Anonymous Access Key Box (Displayed ONCE) */}
            {submissionResult.accessKey && (
              <div className="rounded-xl border border-[#D97706]/40 bg-[#FFFBEB] p-5 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#92400E]">
                  <KeyRound className="h-4 w-4" />
                  <span>Your Secret Anonymous Access Key (Save Now)</span>
                </div>
                <p className="text-[11px] text-[#78350F] leading-relaxed">
                  We store only an irreversible cryptographic hash of this key. If lost, it cannot be recovered. You need this key to view private details, update resolution status, or request deletion without an account.
                </p>

                <div className="flex items-center gap-2 bg-white rounded-lg border border-[#D97706]/30 p-2 font-mono text-xs text-[#17212F] break-all">
                  <span className="flex-1">{submissionResult.accessKey}</span>
                  <button
                    type="button"
                    onClick={() => copyAccessKey(submissionResult.accessKey!)}
                    className="shrink-0 p-1.5 rounded-md hover:bg-gray-100 text-[#92400E]"
                    title="Copy Access Key"
                  >
                    {copiedKey ? <Check className="h-4 w-4 text-[#18794E]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                {copiedKey && (
                  <p className="text-[11px] font-semibold text-[#18794E]">
                    ✓ Access key copied to clipboard! Save it in a password manager or secure notes.
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/track?ref=${submissionResult.referenceNumber}${submissionResult.accessKey ? `&key=${submissionResult.accessKey}` : ""}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA]"
              >
                <Eye className="h-4 w-4" />
                <span>Track or Manage Report</span>
              </Link>
              <Link
                href={`/issues/${submissionResult.issueSlug}`}
                className="w-full sm:w-auto rounded-lg border border-[#E1E5EB] bg-white px-5 py-2.5 text-xs font-semibold text-[#17212F] hover:bg-[#F7F8FA]"
              >
                View Public Issue Dashboard
              </Link>
            </div>

            <div className="pt-4 text-xs text-[#5B6573]">
              Need urgent dispute redressal?{" "}
              <a
                href="https://consumerhelpline.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#2457D6] hover:text-[#1B44AA] inline-flex items-center gap-0.5"
              >
                File with National Consumer Helpline (1915) <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
