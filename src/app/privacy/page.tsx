import { Lock, Shield, Eye, Trash2, KeyRound } from "lucide-react";
import Link from "next/link";

export default function PrivacyNoticePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Lock className="h-3.5 w-3.5" />
          <span>Privacy &amp; Data Protection Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17212F]">
          Privacy Notice &amp; Data Protection Policy
        </h1>
        <p className="text-xs text-[#5B6573]">
          Effective October 2026 • Formulated under Indian Digital Personal Data Protection (DPDP) Principles
        </p>
      </div>

      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-8 text-xs text-[#5B6573] leading-relaxed">
        {/* Section 1 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#2457D6]" />
            <span>1. Core Charter: Anonymous by Default</span>
          </h2>
          <p>
            Awaz is an independent, non-profit public interest platform designed to turn isolated consumer grievances into transparent, credible collective evidence. You do not need to register, provide your name, or submit an email address or phone number to report a consumer grievance.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-[#17212F]">2. Data Minimization &amp; Information We Collect</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] space-y-2">
              <span className="font-bold text-[#17212F]">Mandatory Minimum Fields:</span>
              <ul className="list-disc pl-4 space-y-1 text-[#5B6573]">
                <li><strong>Issue Category: </strong> To categorize the dispute (e.g. Delayed Delivery).</li>
                <li><strong>Factual Description (min 20 chars): </strong> An objective account of what occurred.</li>
                <li><strong>Factual Accuracy Certification: </strong> Formal statement that the report is truthful.</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg border border-[#E1E5EB] bg-[#F7F8FA] space-y-2">
              <span className="font-bold text-[#17212F]">Voluntary / Optional Fields:</span>
              <ul className="list-disc pl-4 space-y-1 text-[#5B6573]">
                <li><strong>Promised Delivery Date: </strong> Helps calculate delay days; optional.</li>
                <li><strong>Order Placement Date: </strong> Helps measure total turnaround; optional.</li>
                <li><strong>State or Territory: </strong> Identifies regional hub failures without street addresses.</li>
                <li><strong>Masked Order Reference: </strong> Optional tracking reference (e.g. OD123***).</li>
                <li><strong>Supporting Evidence: </strong> Optional invoices or tracking screenshots.</li>
                <li><strong>User Account / Email: </strong> Completely optional for multi-report dashboards.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#087E8B]" />
            <span>3. Public Information vs. Private Data</span>
          </h2>
          <p>
            We enforce strict separation between aggregated public evidence and private submissions. Private records are NEVER serialized or exposed on public API endpoints.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-lg border border-[#18794E]/20 bg-[#EDF7F1] text-[#18794E]">
              <strong className="block font-semibold mb-1">What May Become Public:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-[#125838]">
                <li>Public reference code (e.g. AWZ-2026-X89J)</li>
                <li>Aggregated statistical totals and regional counts</li>
                <li>Fulfillment status (Open / Resolved)</li>
                <li>Verification tier (Unverified / Verified)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-lg border border-[#B42318]/20 bg-[#FEF3F2] text-[#B42318]">
              <strong className="block font-semibold mb-1">What is Strictly Private &amp; Never Public:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-xs">
                <li>Raw complaint descriptions and resolution notes</li>
                <li>Original invoices, tracking logs, and evidence files</li>
                <li>Order numbers and personal names</li>
                <li>Contact emails, phone numbers, and IP addresses</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#D97706]" />
            <span>4. Anonymous Access Keys &amp; Self-Management</span>
          </h2>
          <p>
            When submitting without an account, Awaz issues a one-time 256-bit cryptographic Access Key (format: <code>awaz_ak_...</code>).
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Awaz stores only an irreversible SHA-256 cryptographic hash of this key.</li>
            <li>Possession of the Access Key enables you to view your private notes, update delivery resolution, or request complete deletion at <Link href="/track" className="text-[#2457D6] underline">awaz.suvidhatools.in/track</Link>.</li>
            <li>A public reference number alone cannot authorize access or edits.</li>
            <li>If lost, an anonymous access key cannot be regenerated or recovered by staff.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F] flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-[#B42318]" />
            <span>5. Retention, Withdrawal &amp; Deletion Rights</span>
          </h2>
          <p>
            You have the unambiguous right to withdraw your grievance and delete associated private data at any time:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Immediate Evidence Purge: </strong> Requesting deletion via <Link href="/track" className="text-[#2457D6] underline">Track Report</Link> immediately deletes all attached evidence files from storage.</li>
            <li><strong>Text Scrubbing: </strong> Personal descriptions and resolution notes are scrubbed. The record is soft-deleted and removed from all aggregate public metrics.</li>
            <li><strong>Evidence Retention Window: </strong> Where not explicitly withdrawn, private evidence files are queued for automated purge 180 days after case closure.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">6. Security &amp; Technical Safeguards</h2>
          <p>
            Awaz employs server-side input schema validation (Zod), rate limiting against automated abuse, HTTP-only secure cookie sessions, constant-time cryptographic hash verification, and strict role-based access controls for moderators.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">7. Official Consumer Grievance Recourse</h2>
          <p>
            Awaz is an independent advocacy database and does not provide legal representation or binding arbitration. To file an official complaint against a retail company in India, you may contact the National Consumer Helpline at <strong>1915</strong> or file on the government portal at <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer" className="underline text-[#2457D6]">consumerhelpline.gov.in</a>.
          </p>
        </section>

        {/* Section 8: Legal Disclaimer */}
        <section className="rounded-lg border border-[#D97706]/30 bg-[#FFFBEB] p-4 text-xs space-y-2 text-[#92400E]">
          <h2 className="font-bold text-[#78350F] flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>8. Legal Notice &amp; Compliance Disclaimer</span>
          </h2>
          <p>
            The data protection architecture and privacy practices described herein reflect software engineering controls designed for consumer privacy. They do not constitute formal legal advice, nor do they represent a certified audit under the Digital Personal Data Protection Act, 2023 (DPDP) or other applicable jurisdiction laws. Formal compliance affirmations and terms require independent review by qualified legal counsel.
          </p>
        </section>
      </div>
    </div>
  );
}
