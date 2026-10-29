import { Shield, FileText, Users, Lock } from "lucide-react";

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Editorial Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3.5 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>Institutional Counting Standard · Version 1.2</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#17212F] leading-tight">
          Data, Counting &amp; Verification Methodology
        </h1>
        <p className="text-base sm:text-lg text-[#5B6573] leading-relaxed">
          How Awaz measures retail consumer complaints, eliminates duplicate submissions, verifies evidence, and
          preserves statistical integrity without synthetic figures or engagement inflation.
        </p>
      </div>

      {/* 3 Pillars Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#EFF4FF] text-[#2457D6] flex items-center justify-center font-bold">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-[#17212F]">Evidence Over Outrage</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            Every metric requires structured transaction parameters: promised delivery dates, carrier SLA elapsed,
            and tracking status timestamps rather than speculative rants.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#EDF7F1] text-[#18794E] flex items-center justify-center font-bold">
            <Users className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-[#17212F]">Transparent Deduplication</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            Unique affected reporters are measured separately from gross submission counts to guarantee that repeat
            filings do not inflate community grievance volume.
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#F7F8FA] text-[#087E8B] flex items-center justify-center font-bold">
            <Lock className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-[#17212F]">Privacy by Default</h3>
          <p className="text-xs text-[#5B6573] leading-relaxed">
            Residential addresses, order invoice numbers, and payment details are strictly kept server-side in
            private access-controlled storage and are never exposed publicly.
          </p>
        </div>
      </div>

      {/* Core Reference Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        {/* Table of Contents Sticky Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 space-y-3 rounded-2xl border border-[#E1E5EB] bg-[#F7F8FA] p-4 text-xs">
            <span className="font-bold uppercase tracking-wider text-[#17212F] block">
              Contents
            </span>
            <nav className="space-y-1.5">
              <a href="#eligible-reports" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                1. Eligible Reports
              </a>
              <a href="#unique-reporters" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                2. Unique Reporters
              </a>
              <a href="#evidence-criteria" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                3. Evidence Standards
              </a>
              <a href="#resolutions" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                4. Reported Resolutions
              </a>
              <a href="#anti-abuse" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                5. Anti-Abuse Controls
              </a>
              <a href="#dispute-process" className="block text-[#5B6573] hover:text-[#2457D6] transition-colors">
                6. Corrections &amp; Reply
              </a>
            </nav>
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-3 space-y-10">
          {/* Section 1: Eligible Reports */}
          <section id="eligible-reports" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">1.</span> Total Eligible Reports
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>
                <strong>Definition:</strong> The cumulative count of consumer complaint submissions that satisfy published
                platform eligibility requirements:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Applies to an identified retail consumer transaction (currently Flipkart in India).</li>
                <li>The promised delivery fulfillment date or SLA has elapsed without delivery confirmation.</li>
                <li>The report contains a factual experience narrative of at least 20 characters.</li>
                <li>The filing citizen explicitly certifies accuracy and accepts public documentation consent.</li>
                <li>The report has not been withdrawn, deleted, or rejected as fraudulent/abusive by moderators.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Unique Reporters */}
          <section id="unique-reporters" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">2.</span> Unique Reporters (Deduplicated Counting)
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>
                <strong>Definition:</strong> The number of distinct verified individuals who have filed an eligible grievance.
              </p>
              <p>
                To avoid statistical skew from a single consumer submitting multiple updates for consecutive orders,
                multiple filings from one registered account are grouped under <strong>1 unique reporter</strong>.
                Anonymous submissions are verified for distinctness through cryptographic token isolation and IP rate limiting.
              </p>
            </div>
          </section>

          {/* Section 3: Evidence Standards */}
          <section id="evidence-criteria" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">3.</span> Evidence-Backed Grievance Standard
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>
                <strong>Definition:</strong> Reports where the citizen voluntarily attached verifiable documentation, such as
                order status screenshots, courier tracking correspondence, or customer service transcripts.
              </p>
              <div className="rounded-xl bg-[#F7F8FA] p-4 space-y-1.5 border border-[#E1E5EB]">
                <span className="font-bold text-[#17212F]">Verification Status Transitions:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E1E5EB]">
                    <span className="font-bold text-[#5B6573] block">UNVERIFIED</span>
                    Factual report filed without supporting document.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E1E5EB]">
                    <span className="font-bold text-[#946200] block">EVIDENCE SUBMITTED</span>
                    Document attached; pending moderation review.
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E1E5EB]">
                    <span className="font-bold text-[#18794E] block">VERIFIED</span>
                    Order SLA and failure corroborated by verification officer.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Customer Resolutions */}
          <section id="resolutions" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">4.</span> Reported Resolutions
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>
                <strong>Definition:</strong> Grievances where the reporting citizen explicitly returned to their report
                dossier and recorded that their shipment was delivered, a replacement was provided, or an unconditional
                refund was credited.
              </p>
              <div className="rounded-xl bg-[#EFF4FF] border border-[#2457D6]/20 p-4 text-[#17212F]">
                <strong>Integrity Clause:</strong> Awaz measures resolution rates as an indicator of problem resolution
                timelines. Awaz never asserts that its platform was the sole or proximate cause of any company’s remedial action.
              </div>
            </div>
          </section>

          {/* Section 5: Anti-Abuse & Deduplication */}
          <section id="anti-abuse" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">5.</span> Anti-Abuse &amp; Statistical Protection
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>To prevent bad-faith manipulation, coordinated harassment, or bot inflation:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Sliding-Window Throttling:</strong> API rate limiting blocks automated rapid-fire submissions.</li>
                <li><strong>Cryptographic Idempotency:</strong> Submissions require client idempotency keys to prevent accidental double-submits.</li>
                <li><strong>Jaccard Similarity Analysis:</strong> Duplicate or near-identical text submissions from identical origins are intercepted and flagged for moderation review.</li>
                <li><strong>Dual Access Architecture:</strong> Supports both registered citizen accounts and privacy-preserving anonymous submissions secured with high-entropy access keys.</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Dispute & Corrections */}
          <section id="dispute-process" className="space-y-3 scroll-mt-24">
            <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
              <span className="text-[#2457D6]">6.</span> Factual Corrections &amp; Merchant Right of Reply
            </h2>
            <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 shadow-xs space-y-3 text-xs text-[#5B6573] leading-relaxed">
              <p>
                Awaz enforces absolute truthfulness. Both consumers and verified retailer grievance officers may request
                corrections or submit proof of dispute resolution.
              </p>
              <div className="rounded-xl bg-[#F7F8FA] p-4 border border-[#E1E5EB]">
                Email our verification desk at{" "}
                <a href="mailto:corrections@awaz.org" className="text-[#2457D6] font-bold underline">
                  corrections@awaz.org
                </a>{" "}
                with your reference number and corroborating transaction proof.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
