import { Shield, FileText, Users, Lock } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>Public Evidence Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17212F]">
          Data & Verification Methodology
        </h1>
        <p className="text-sm sm:text-base text-[#5B6573] leading-relaxed">
          How Awaz measures consumer complaints, verifies evidence, and maintains statistical integrity.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
          <FileText className="h-5 w-5 text-[#2457D6]" />
          <h3 className="text-sm font-bold text-[#17212F]">Evidence Over Outrage</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            We prioritize structured, verifiable facts (order dates, promise SLAs, tracking timestamps) over emotional speculation.
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
          <Users className="h-5 w-5 text-[#087E8B]" />
          <h3 className="text-sm font-bold text-[#17212F]">Transparent Counting</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            Unique affected reporters are tracked separately from gross submission counts to prevent artificial repetition.
          </p>
        </div>

        <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
          <Lock className="h-5 w-5 text-[#18794E]" />
          <h3 className="text-sm font-bold text-[#17212F]">Privacy by Default</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            Personally identifying customer information, delivery addresses, and payment data are strictly confidential.
          </p>
        </div>
      </div>

      {/* Definitions Section */}
      <section id="definitions" className="space-y-6">
        <h2 className="text-2xl font-bold text-[#17212F] border-b border-[#E1E5EB] pb-3">
          1. Metric Definitions
        </h2>

        <div className="space-y-4">
          <div id="eligible-reports" className="rounded-xl border border-[#E1E5EB] bg-white p-6 space-y-2">
            <h3 className="text-base font-bold text-[#17212F]">Total Eligible Reports</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              <strong>Definition: </strong> The cumulative count of consumer complaint submissions that satisfy published eligibility rules:
            </p>
            <ul className="list-disc pl-5 text-xs text-[#5B6573] space-y-1">
              <li>Applies to an identified consumer transaction with Flipkart in India.</li>
              <li>Promised delivery date has elapsed without timely fulfillment.</li>
              <li>The complaint is not flagged as spam, malicious harassment, or rejected by moderators.</li>
            </ul>
          </div>

          <div id="unique-reporters" className="rounded-xl border border-[#E1E5EB] bg-white p-6 space-y-2">
            <h3 className="text-base font-bold text-[#17212F]">Unique Reporters</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              <strong>Definition: </strong> The number of distinct verified consumer accounts that have filed an eligible complaint within the specified scope.
            </p>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              If a single customer submits three separate complaints regarding consecutive delayed orders, their reports contribute 3 to Total Eligible Reports, but exactly 1 to Unique Reporters.
            </p>
          </div>

          <div id="evidence-criteria" className="rounded-xl border border-[#E1E5EB] bg-white p-6 space-y-2">
            <h3 className="text-base font-bold text-[#17212F]">Evidence-Backed Reports</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              <strong>Definition: </strong> Reports where the citizen has attached supporting documentation (such as redacted tax invoices, courier status screenshots, or customer support chat transcripts).
            </p>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              When documentation is independently corroborated by human verification officers, the status transitions from <em>Evidence Submitted</em> to <em>Verified</em>.
            </p>
          </div>

          <div id="resolutions" className="rounded-xl border border-[#E1E5EB] bg-white p-6 space-y-2">
            <h3 className="text-base font-bold text-[#17212F]">Reported Resolutions</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              <strong>Definition: </strong> Reports where the customer has explicitly signed into their account and confirmed that their package has arrived or a satisfactory refund was issued.
            </p>
            <div className="rounded-lg bg-[#F7F8FA] p-3 text-xs text-[#5B6573]">
              <strong>Important Caveat: </strong> Awaz tracks consumer-confirmed resolution rates as an indicator of problem lifecycle, but never asserts that Awaz was the sole proximate cause of the company’s action.
            </div>
          </div>
        </div>
      </section>

      {/* Anti-Abuse & Duplication */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#17212F] border-b border-[#E1E5EB] pb-3">
          2. Anti-Abuse & Duplicate Protection
        </h2>
        <div className="text-xs text-[#5B6573] space-y-3 leading-relaxed">
          <p>
            To prevent organized manipulation, spam bot campaigns, or bad-faith distortion:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Rate Limiting: </strong> Submission endpoints and account actions enforce sliding-window request throttling.</li>
            <li><strong>Account Verification: </strong> Complaint filing requires an authenticated citizen account.</li>
            <li><strong>Idempotency Enforcement: </strong> Client retries and double-clicks submit an idempotency token to prevent duplicate creation.</li>
            <li><strong>Jaccard Similarity Analysis: </strong> Repeated identical submissions from the same account are automatically intercepted and flagged for moderation review.</li>
          </ul>
        </div>
      </section>

      {/* Dispute & Corrections */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#17212F] border-b border-[#E1E5EB] pb-3">
          3. Corrections, Appeals & Merchant Right of Reply
        </h2>
        <p className="text-xs text-[#5B6573] leading-relaxed">
          Awaz maintains an open audit trail for corrections. Both consumers and corporate representatives may submit factual evidence or notify our verification team if an issue description is inaccurate or has been fully resolved.
        </p>
        <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-5 text-xs text-[#5B6573]">
          Email our verification desk at{" "}
          <a href="mailto:corrections@awaz.org" className="text-[#2457D6] font-semibold underline">
            corrections@awaz.org
          </a>{" "}
          with your reference number and corroborating details.
        </div>
      </section>
    </div>
  );
}
