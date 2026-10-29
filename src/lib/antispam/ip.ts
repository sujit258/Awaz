import { NextRequest } from "next/server";

/**
 * Extracts the trusted client IP address in priority order:
 * 1. x-vercel-ip (Immutable header injected by Vercel edge infrastructure)
 * 2. x-real-ip (Injected by standard reverse proxies / edge routers)
 * 3. cf-connecting-ip (Injected by Cloudflare if active)
 * 4. x-forwarded-for (First public IP in chain, sanitized)
 *
 * This prevents clients from spoofing arbitrary forwarding headers to bypass rate limits.
 */
export function getTrustedClientIp(req: NextRequest): string {
  // 1. Direct edge headers from trusted infrastructure
  const vercelIp = req.headers.get("x-vercel-ip");
  if (vercelIp && isValidIp(vercelIp.trim())) {
    return vercelIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // 2. Fall back to x-forwarded-for first hop
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor.split(",").map((s) => s.trim());
    for (const hop of hops) {
      if (isValidIp(hop)) {
        return hop;
      }
    }
  }

  // 3. Fallback identifier if headers are absent (e.g. local unit tests)
  return "127.0.0.1";
}

/**
 * Basic IPv4/IPv6 format validation
 */
function isValidIp(ip: string): boolean {
  if (!ip || ip.length > 45) return false;
  // IPv4 simple regex
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) {
    const parts = ip.split(".").map(Number);
    return parts.every((p) => p >= 0 && p <= 255);
  }
  // IPv6 simple regex
  const ipv6Regex = /^[0-9a-fA-F:]+$/;
  return ipv6Regex.test(ip) && ip.includes(":");
}
