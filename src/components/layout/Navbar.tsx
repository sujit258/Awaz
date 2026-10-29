"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Menu, X, User as UserIcon, LogOut, ChevronRight } from "lucide-react";

interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "CITIZEN" | "MODERATOR" | "ADMIN";
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch {
      // Ignored
    }
  }

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/issues", label: "Explore Issues" },
    { href: "/track", label: "Track Report" },
    { href: "/methodology", label: "Methodology" },
    { href: "/about", label: "How It Works" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E1E5EB] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-[#172B4D] focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2457D6] text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#172B4D]">Awaz</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-[#5B6573] border-l border-[#E1E5EB] pl-2">
                Public Consumer Evidence
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-[#2457D6] font-semibold"
                      : "text-[#5B6573] hover:text-[#172B4D]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user && (user.role === "ADMIN" || user.role === "MODERATOR") && (
              <Link
                href="/admin"
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "text-[#087E8B] font-semibold"
                    : "text-[#087E8B] hover:text-[#065A63]"
                }`}
              >
                Moderation Queue
              </Link>
            )}
          </nav>
        </div>

        {/* Right CTA & Account */}
        <div className="hidden md:flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/my-reports"
                    className="flex items-center gap-1.5 text-sm font-medium text-[#172B4D] hover:text-[#2457D6] px-3 py-1.5 rounded-md hover:bg-[#F7F8FA] border border-transparent hover:border-[#E1E5EB]"
                  >
                    <UserIcon className="h-4 w-4 text-[#5B6573]" />
                    <span>My Reports</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 text-[#5B6573] hover:text-[#B42318] rounded-md hover:bg-[#FEF3F2]"
                    title="Sign Out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm font-medium text-[#172B4D] hover:text-[#2457D6] px-3 py-1.5 rounded-md hover:bg-[#F7F8FA]"
                >
                  Sign In
                </Link>
              )}
            </>
          )}

          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2457D6] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1B44AA] transition-colors focus:ring-2 focus:ring-[#2457D6] focus:ring-offset-2"
          >
            <span>Report an Issue</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/report"
            className="rounded-lg bg-[#2457D6] px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Report
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#5B6573] hover:text-[#172B4D] rounded-md hover:bg-[#F7F8FA]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E1E5EB] bg-white px-4 pt-2 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === link.href
                    ? "bg-[#F7F8FA] text-[#2457D6] font-semibold"
                    : "text-[#5B6573] hover:bg-[#F7F8FA]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (user.role === "ADMIN" || user.role === "MODERATOR") && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#087E8B] rounded-md hover:bg-[#F7F8FA]"
              >
                Moderation Queue
              </Link>
            )}
            {user && (
              <Link
                href="/my-reports"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-[#172B4D] rounded-md hover:bg-[#F7F8FA]"
              >
                My Reports ({user.displayName || user.email})
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-[#E1E5EB] flex items-center justify-between">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-[#B42318] py-1.5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#2457D6] py-1.5"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg bg-[#2457D6] px-4 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
