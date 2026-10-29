"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
  Shield,
  Search,
  FileText,
  BarChart2,
} from "lucide-react";
import AwazLogo from "@/components/brand/AwazLogo";

interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "CITIZEN" | "MODERATOR" | "ADMIN";
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Unauthenticated
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronize menu state on navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
      setResourcesOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      // Ignore
    }
  }

  const isStaff = user && (user.role === "ADMIN" || user.role === "MODERATOR");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E1E5EB] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Lockup */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus:outline-none group"
            aria-label="Awaz - Independent Consumer Evidence Platform"
          >
            <AwazLogo variant="icon" size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#17212F] group-hover:text-[#2457D6] transition-colors leading-none">
                Awaz<span className="text-[#2457D6]">.</span>
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#5B6573] mt-0.5 hidden sm:inline-block">
                Consumer Evidence
              </span>
            </div>
          </Link>

          {/* Desktop Primary Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === "/"
                  ? "bg-[#EFF4FF] text-[#2457D6]"
                  : "text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
              }`}
            >
              Overview
            </Link>

            <Link
              href="/issues"
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                pathname === "/issues" || pathname.startsWith("/issues/")
                  ? "bg-[#EFF4FF] text-[#2457D6]"
                  : "text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
              }`}
            >
              Explore Issues
            </Link>

            {/* Secondary Resources Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setResourcesOpen(!resourcesOpen)}
                aria-expanded={resourcesOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  resourcesOpen || pathname === "/methodology" || pathname === "/about" || pathname === "/track"
                    ? "text-[#17212F] bg-[#F7F8FA]"
                    : "text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
                }`}
              >
                <span>Trust &amp; Tools</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
              </button>

              {resourcesOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-xl border border-[#E1E5EB] bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 z-50">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6573] px-3 py-1.5">
                    Citizen Services
                  </div>
                  <Link
                    href="/track"
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[#F7F8FA] transition-colors group"
                  >
                    <Search className="h-4 w-4 text-[#2457D6] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-[#17212F] group-hover:text-[#2457D6] block">
                        Track a Report
                      </span>
                      <span className="text-[11px] text-[#5B6573] leading-snug block">
                        Look up anonymous complaint progress with access key
                      </span>
                    </div>
                  </Link>

                  <div className="my-1 border-t border-[#E1E5EB]"></div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5B6573] px-3 py-1.5">
                    Standards &amp; Mission
                  </div>

                  <Link
                    href="/methodology"
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[#F7F8FA] transition-colors group"
                  >
                    <BarChart2 className="h-4 w-4 text-[#087E8B] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-[#17212F] group-hover:text-[#087E8B] block">
                        Counting Methodology
                      </span>
                      <span className="text-[11px] text-[#5B6573] leading-snug block">
                        Deduplication, verification standards, and SLAs
                      </span>
                    </div>
                  </Link>

                  <Link
                    href="/about"
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-[#F7F8FA] transition-colors group"
                  >
                    <Shield className="h-4 w-4 text-[#18794E] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold text-[#17212F] group-hover:text-[#18794E] block">
                        Independence Charter
                      </span>
                      <span className="text-[11px] text-[#5B6573] leading-snug block">
                        Non-governmental public interest platform principles
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Restricted Moderation Queue for Staff */}
            {isStaff && (
              <Link
                href="/admin"
                className={`ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-[#087E8B] text-white"
                    : "bg-[#EDF7F1] text-[#087E8B] hover:bg-[#D7EFE6] border border-[#087E8B]/20"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Moderation Queue</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right CTA & Account Area */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/my-reports"
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
                      pathname === "/my-reports"
                        ? "bg-[#EFF4FF] border-[#2457D6]/30 text-[#2457D6]"
                        : "border-[#E1E5EB] bg-white text-[#17212F] hover:bg-[#F7F8FA]"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-[#5B6573]" />
                    <span>My Reports</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-[#5B6573] hover:text-[#B42318] rounded-lg hover:bg-[#FEF3F2] transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-xs font-semibold text-[#5B6573] hover:text-[#17212F] px-3 py-2 rounded-lg hover:bg-[#F7F8FA] transition-colors"
                >
                  Sign In
                </Link>
              )}
            </>
          )}

          {/* Primary Action Button */}
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1B44AA] transition-all hover:shadow-md focus:ring-2 focus:ring-[#2457D6] focus:ring-offset-2"
          >
            <span>Report an Issue</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/report"
            className="inline-flex items-center rounded-lg bg-[#2457D6] px-3 py-1.5 text-xs font-bold text-white shadow-xs"
          >
            Report
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA] rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Flyout */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E1E5EB] bg-white px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6573] block px-3 py-1">
              Primary Destinations
            </span>
            <Link
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === "/" ? "bg-[#EFF4FF] text-[#2457D6]" : "text-[#17212F] hover:bg-[#F7F8FA]"
              }`}
            >
              Overview
            </Link>
            <Link
              href="/issues"
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname.startsWith("/issues") ? "bg-[#EFF4FF] text-[#2457D6]" : "text-[#17212F] hover:bg-[#F7F8FA]"
              }`}
            >
              Explore Issues
            </Link>
            <Link
              href="/track"
              className={`block px-3 py-2 rounded-lg text-sm font-semibold ${
                pathname === "/track" ? "bg-[#EFF4FF] text-[#2457D6]" : "text-[#17212F] hover:bg-[#F7F8FA]"
              }`}
            >
              Track a Report
            </Link>
          </div>

          <div className="border-t border-[#E1E5EB] pt-3 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6573] block px-3 py-1">
              Trust &amp; Standards
            </span>
            <Link
              href="/methodology"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
            >
              Counting Methodology
            </Link>
            <Link
              href="/about"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
            >
              Independence Charter
            </Link>
            <Link
              href="/privacy"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
            >
              Privacy Notice
            </Link>
          </div>

          {isStaff && (
            <div className="border-t border-[#E1E5EB] pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#087E8B] block px-3 py-1">
                Authorized Staff
              </span>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-[#EDF7F1] text-[#087E8B]"
              >
                <Shield className="h-4 w-4" />
                <span>Moderation Queue</span>
              </Link>
            </div>
          )}

          <div className="border-t border-[#E1E5EB] pt-3 flex items-center justify-between px-3">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <Link href="/my-reports" className="text-xs font-semibold text-[#2457D6]">
                  My Reports ({user.email})
                </Link>
                <button onClick={handleLogout} className="text-xs font-semibold text-[#B42318]">
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-xs font-semibold text-[#2457D6]">
                Citizen Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
