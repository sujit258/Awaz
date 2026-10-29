"use client";

import Link from "next/link";
import { Shield, ExternalLink, HelpCircle, FileText, Lock, Info } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[#E1E5EB] bg-white text-[#5B6573]">
      {/* Official Grievance Resources Banner */}
      <div className="border-b border-[#E1E5EB] bg-[#F7F8FA] py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-2 max-w-3xl">
              <HelpCircle className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#17212F]">Official Government Recourse (India): </span>
                <span className="text-[#5B6573]">
                  Awaz is an independent documentation platform, not a government service. For official dispute resolution:
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    <strong>Informal Grievance Mediation: </strong>
                    National Consumer Helpline (NCH){" "}
                    <strong className="text-[#17212F]">1915</strong> (Toll Free) or{" "}
                    <a
                      href="https://consumerhelpline.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#2457D6] hover:text-[#1B44AA] inline-flex items-center gap-0.5"
                    >
                      consumerhelpline.gov.in <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                  <span>
                    <strong>Statutory Commission Filing: </strong>
                    <a
                      href="https://e-jagriti.gov.in/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[#2457D6] hover:text-[#1B44AA] inline-flex items-center gap-0.5"
                    >
                      e-Jagriti Consumer Commission Portal <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    (District/State/National Commissions)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Independence Statement */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2457D6] text-white">
                <Shield className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold text-[#172B4D]">Awaz</span>
            </div>
            <p className="text-sm leading-relaxed text-[#5B6573] max-w-md">
              Awaz is an independent, public-interest customer complaint platform. We help consumers
              turn isolated issues into credible, aggregated evidence and constructive collective action.
            </p>
            <div className="rounded-md border border-[#E1E5EB] bg-[#F7F8FA] p-3 text-xs text-[#5B6573] leading-relaxed">
              <strong className="text-[#17212F]">Independent Platform Disclaimer: </strong>
              Awaz is not affiliated with, endorsed by, or operated by Flipkart Internet Private Limited
              or any other mentioned corporate entity. Displayed figures represent voluntary reports
              submitted to Awaz under our public verification standard, not official company-wide totals.
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#17212F] uppercase mb-3">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-[#172B4D] transition-colors">
                  Public Dashboard
                </Link>
              </li>
              <li>
                <Link href="/issues" className="hover:text-[#172B4D] transition-colors">
                  Explore Issues
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-[#172B4D] transition-colors">
                  Submit a Report
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-[#172B4D] transition-colors">
                  Track Report
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-[#172B4D] transition-colors">
                  Counting Methodology
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#172B4D] transition-colors">
                  Mission & Independence
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Integrity */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-[#17212F] uppercase mb-3">
              Privacy & Standards
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="hover:text-[#172B4D] transition-colors flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-[#5B6573]" />
                  Privacy by Default
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#172B4D] transition-colors flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#5B6573]" />
                  Terms & Acceptable Use
                </Link>
              </li>
              <li>
                <Link href="/methodology#verification" className="hover:text-[#172B4D] transition-colors flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[#5B6573]" />
                  Evidence Verification
                </Link>
              </li>
              <li>
                <a
                  href="mailto:corrections@awaz.org"
                  className="hover:text-[#172B4D] transition-colors"
                >
                  Report Inaccuracy / Dispute
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E1E5EB] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Awaz Consumer Evidence Platform. Non-profit public interest initiative.</p>
          <p className="text-[#5B6573]">
            Accessibility Target: WCAG 2.2 AA compliant. Neutral, evidence-backed representation.
          </p>
        </div>
      </div>
    </footer>
  );
}
