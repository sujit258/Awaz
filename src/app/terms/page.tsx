import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E]">
          <FileText className="h-3.5 w-3.5" />
          <span>Terms of Use</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17212F]">
          Terms of Service & Acceptable Use Policy
        </h1>
        <p className="text-xs text-[#5B6573]">
          Last updated: October 2026 • Governing voluntary public-interest consumer reporting
        </p>
      </div>

      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6 text-xs text-[#5B6573] leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">1. Independent Public-Interest Nature</h2>
          <p>
            Awaz is an independent consumer complaint aggregation platform. Awaz is not affiliated with, endorsed by, or operated by Flipkart Internet Private Limited or any other marketplace.
          </p>
          <p>
            Awaz does not possess regulatory, statutory, or judicial authority to enforce civil remedies or declare corporate wrongdoing. Displayed metrics represent voluntary consumer submissions analyzed under the Awaz Public Verification Standard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">2. Factual Representation Requirement</h2>
          <p>
            Users agree that all information, dates, order statuses, and evidence submitted to Awaz are true, factual, and accurate to the best of their personal knowledge. Submitting knowingly falsified documentation, deceptive claims, or fraudulent grievances is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">3. Strict Zero-Tolerance for Harassment</h2>
          <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-4 text-[#B42318] space-y-1">
            <strong>Prohibited Activities:</strong>
            <p>
              Awaz exists for constructive consumer redressal. The platform may not be used for targeted harassment, doxxing individual delivery personnel or customer support executives, coordinating mass spam attacks, or publishing defamatory statements.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">4. Collective Action Escapes & Disclaimers</h2>
          <p>
            Collective action campaigns hosted on Awaz provide downloadable, factual representations for submission to recognized legal consumer bodies (such as the National Consumer Helpline or District Consumer Disputes Redressal Commissions). Participation is voluntary, and participants may withdraw at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#17212F]">5. Moderation and Removal Rights</h2>
          <p>
            Awaz moderators reserve the right to verify, dispute, reject, or archive any submission that fails our credibility checks or violates these terms. An audit log is maintained for all moderation decisions.
          </p>
        </section>
      </div>
    </div>
  );
}
