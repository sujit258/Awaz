import Link from "next/link";
import { Shield, Target, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#EDF7F1] px-3 py-1 text-xs font-semibold text-[#18794E]">
          <Shield className="h-3.5 w-3.5" />
          <span>About Awaz</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#17212F]">
          One Issue. Many Voices. Visible Evidence.
        </h1>
        <p className="text-sm sm:text-base text-[#5B6573] leading-relaxed">
          Awaz is an independent public-interest platform designed to bridge the gap between
          isolated customer grievances and systemic corporate accountability.
        </p>
      </div>

      {/* Mission */}
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-xl font-bold text-[#17212F] flex items-center gap-2">
          <Target className="h-5 w-5 text-[#2457D6]" />
          Our Mission
        </h2>
        <p className="text-sm text-[#5B6573] leading-relaxed">
          When an individual customer’s package is delayed without an explanation or refund, they often face circular automated chatbots and repeated generic promises. In isolation, a customer has little leverage.
        </p>
        <p className="text-sm text-[#5B6573] leading-relaxed">
          Awaz provides the infrastructure for consumers to submit factual, verifiable complaint timelines. By aggregating isolated complaints into verified public issue pages, Awaz provides transparent evidence that consumers, consumer protection authorities, and retailers can use to achieve constructive resolution.
        </p>
      </div>

      {/* Principles */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#17212F]">Product Principles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
            <h3 className="text-sm font-bold text-[#17212F]">Evidence Over Outrage</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              We do not publish sensational rant feeds or unverified viral outrage. Every metric is backed by stated fulfillment SLAs, order timestamps, and verified proof.
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
            <h3 className="text-sm font-bold text-[#17212F]">Constructive Collective Action</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              The purpose of collective action is factual, lawful representation — not harassment, doxxing, or coordinated abuse.
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
            <h3 className="text-sm font-bold text-[#17212F]">Honest Representation of Uncertainty</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              A verified report means the submitted evidence supports the stated reporting criteria; it does not constitute an official court judgment that a company acted unlawfully.
            </p>
          </div>

          <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 space-y-2">
            <h3 className="text-sm font-bold text-[#17212F]">Independent & Neutral</h3>
            <p className="text-xs text-[#5B6573] leading-relaxed">
              Awaz operates independently. We are not paid by, affiliated with, or beholden to any e-commerce marketplace or courier logistics partner.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-xl border border-[#E1E5EB] bg-[#F7F8FA] p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-[#17212F]">
          Have You Experienced a Delivery Grievance?
        </h3>
        <p className="text-xs text-[#5B6573] max-w-md mx-auto">
          Help build a transparent, documented record of consumer service delivery across India.
        </p>
        <div>
          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2457D6] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA]"
          >
            <span>Report Your Experience</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
