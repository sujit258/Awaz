import { Lock } from "lucide-react";

export default function PrivacyNoticePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Lock className="h-3.5 w-3.5" />
          <span>Privacy Standard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17212F]">
          Privacy Notice & Data Protection Policy
        </h1>
        <p className="text-xs text-[#5B6573]">
          Last updated: October 2026 • Compliant with Indian Consumer Protection & DPDP principles
        </p>
      </div>

      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6 text-xs text-[#5B6573] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">1. Core Commitment: Privacy by Default</h2>
          <p>
            Awaz is built to protect consumer privacy while illuminating systemic service patterns. We collect only what is strictly necessary to establish the credibility of an order delay and prevent automated spam.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">2. What We Collect and Why</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account Credentials: </strong> Email address and hashed passwords to manage your submissions and prevent sock-puppet manipulation.</li>
            <li><strong>Fulfillment Timelines: </strong> Promised delivery date, actual delivery date, and order status to measure compliance against promised SLAs.</li>
            <li><strong>Anonymized Geographic Region: </strong> State or Union Territory (e.g. Maharashtra, Karnataka) to identify regional logistics hub breakdowns. We do not collect your physical home or apartment address.</li>
            <li><strong>Supporting Evidence (Optional): </strong> User-uploaded invoices or tracking screenshots, which remain confidential and access-restricted.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">3. What We Never Publish</h2>
          <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-4 text-[#B42318] space-y-1">
            <strong>Strict Confidentiality:</strong>
            <p>
              We never expose full personal names, residential addresses, mobile numbers, payment details, or unredacted evidence files in public feeds or search engine indexes.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">4. Evidence Retention & Deletion</h2>
          <p>
            Evidence files are retained for verification purposes for a maximum of 180 days after case closure. Users may request full account and submission deletion at any time by emailing privacy@awaz.org.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">5. Security Controls</h2>
          <p>
            Awaz enforces server-side file type and size validation, secure JWT sessions with HTTP-only cookies, encrypted database storage, and role-based access restrictions for administrative operations.
          </p>
        </section>
      </div>
    </div>
  );
}
