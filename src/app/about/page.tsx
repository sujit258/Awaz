import Link from "next/link";
import { Shield, Target, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-14">
      {/* Editorial Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] border border-[#18794E]/20 px-3.5 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>Independent Consumer Rights Charter</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#17212F] leading-tight">
          How Awaz Works
        </h1>
        <p className="text-base sm:text-lg text-[#5B6573] leading-relaxed">
          Awaz bridges the systemic gap between isolated customer complaints and verifiable, aggregated public evidence.
          We provide the open infrastructure for Indian consumers to hold corporate fulfillment accountable.
        </p>
      </div>

      {/* The 4-Step Consumer Journey */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-[#17212F]">The Awaz Evidence Lifecycle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-[#EFF4FF] text-[#2457D6] flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-bold text-[#17212F]">Document Experience</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              File a structured factual report with your promised delivery date, carrier status updates, and voluntary tracking evidence.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-[#EDF7F1] text-[#18794E] flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-bold text-[#17212F]">Deduplicate &amp; Verify</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              Submissions are scrubbed of personal identifiers, checked against anti-abuse filters, and verified for transaction validity.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-[#EFF4FF] text-[#087E8B] flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-bold text-[#17212F]">Public Evidence Dossier</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              Isolated reports cluster into live public issue pages showing regional patterns, fulfillment failure trends, and timelines.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 shadow-xs space-y-2">
            <div className="h-8 w-8 rounded-xl bg-[#F7F8FA] text-[#17212F] flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="text-sm font-bold text-[#17212F]">Statutory Recourse</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              Download formatted Evidence Packs to submit directly to the National Consumer Helpline (1915) or e-Jagriti consumer commission.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <div className="rounded-2xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
          <Target className="h-5 w-5 text-[#2457D6]" />
          Our Mission &amp; Purpose
        </h2>
        <p className="text-xs sm:text-sm text-[#5B6573] leading-relaxed">
          When an individual customer’s package is delayed without an explanation or refund, they face circular automated chatbots and repetitive generic promises. In isolation, a consumer has zero leverage.
        </p>
        <p className="text-xs sm:text-sm text-[#5B6573] leading-relaxed">
          Awaz turns isolated grievances into transparent, aggregated public evidence. We give consumers, legal advocates, and marketplace grievance officers the verified facts required to achieve lawful, systemic redressal.
        </p>
      </div>

      {/* Independence Charter */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[#17212F]">Institutional Independence Guarantees</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl border border-[#E1E5EB] bg-white space-y-2">
            <span className="font-bold text-[#17212F] block">Independent &amp; Non-Governmental</span>
            <p className="text-[#5B6573] leading-relaxed">
              Awaz is an independent consumer technology platform. We are not a government court, regulatory commission, or official corporate representative.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[#E1E5EB] bg-white space-y-2">
            <span className="font-bold text-[#17212F] block">Zero Sponsored Distortion</span>
            <p className="text-[#5B6573] leading-relaxed">
              We do not accept corporate sponsorships, advertising dollars, or review manipulation fees from any monitored retailer or logistics partner.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[#E1E5EB] bg-white space-y-2">
            <span className="font-bold text-[#17212F] block">Zero Synthetic Data Policy</span>
            <p className="text-[#5B6573] leading-relaxed">
              We never seed fake complaints, fabricated testimonials, artificial counters, or simulated resolutions to make pages appear busy.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-[#E1E5EB] bg-white space-y-2">
            <span className="font-bold text-[#17212F] block">Merchant Right of Reply</span>
            <p className="text-[#5B6573] leading-relaxed">
              We maintain open dispute mechanisms for retailers to corroborate order fulfillment or correct inaccurate public records.
            </p>
          </div>
        </div>
      </section>

      {/* Primary CTA */}
      <div className="rounded-2xl border border-[#2457D6]/20 bg-[#EFF4FF] p-8 text-center space-y-3">
        <h3 className="text-xl font-bold text-[#17212F]">
          Have You Experienced an Unresolved Retail Delivery Grievance?
        </h3>
        <p className="text-xs text-[#5B6573] max-w-md mx-auto leading-relaxed">
          Document your delivery timeline with proof and make it part of India&apos;s verified public consumer record.
        </p>
        <div className="pt-2">
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] transition-colors"
          >
            <span>Document a Delivery Grievance</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
