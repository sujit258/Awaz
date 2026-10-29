"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, User } from "lucide-react";
import AwazLogo from "@/components/brand/AwazLogo";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
    const payload = isRegister ? { email, password, displayName } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Authentication failed. Please check your credentials.");
      } else {
        router.push("/my-reports");
      }
    } catch {
      setError("Network error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-[#E1E5EB] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-2">
          <AwazLogo variant="icon" size={44} className="mx-auto" />
          <h1 className="text-xl font-bold text-[#17212F]">
            {isRegister ? "Create a Citizen Account" : "Sign In to Awaz"}
          </h1>
          <p className="text-xs text-[#5B6573]">
            {isRegister
              ? "Join Awaz to document complaints and participate in verified collective action."
              : "Manage your submitted complaints and access verified issue records."}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-[#FEF3F2] border border-[#B42318]/20 p-3 text-xs text-[#B42318]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#17212F] mb-1">
                Display Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
                <input
                  type="text"
                  placeholder="e.g. Arun K."
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-[#E1E5EB] bg-white pl-9 pr-3.5 py-2 text-xs text-[#17212F] focus:border-[#2457D6]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#17212F] mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[#E1E5EB] bg-white pl-9 pr-3.5 py-2 text-xs text-[#17212F] focus:border-[#2457D6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17212F] mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#5B6573]" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[#E1E5EB] bg-white pl-9 pr-3.5 py-2 text-xs text-[#17212F] focus:border-[#2457D6]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2457D6] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1B44AA] disabled:opacity-50 transition-colors"
          >
            <span>{loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="pt-2 border-t border-[#E1E5EB] text-center text-xs text-[#5B6573]">
          {isRegister ? (
            <span>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError(null);
                }}
                className="font-semibold text-[#2457D6] hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don’t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError(null);
                }}
                className="font-semibold text-[#2457D6] hover:underline"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

        {/* Security & Privacy Notice */}
        <div className="rounded-lg bg-[#F7F8FA] border border-[#E1E5EB] p-3 text-[11px] text-[#5B6573] text-center">
          <p>
            Awaz protects reporter privacy by default. Authentication is encrypted using HTTP-only secure cookies. Passwords are never stored in plain text.
          </p>
        </div>
      </div>
    </div>
  );
}
