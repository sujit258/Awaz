import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyAccessKey } from "@/lib/auth/access-key";
import { toPublicReportDTO, toOwnerReportDTO } from "@/lib/dto/report";
import { checkRateLimit } from "@/lib/antispam/rate-limit";
import { getTrustedClientIp } from "@/lib/antispam/ip";

export async function GET(req: NextRequest) {
  try {
    const clientIp = getTrustedClientIp(req);

    // Rate limit lookups: 20 per minute per IP to prevent enumeration
    const rateCheck = checkRateLimit(`track:${clientIp}`, 20, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many tracking requests. Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref")?.trim();
    // Header-only transport: NEVER accept access keys in query parameters
    const accessKey = req.headers.get("x-awaz-access-key")?.trim();

    if (!ref) {
      return NextResponse.json(
        { error: "Please provide a valid Awaz reference number (e.g. AWZ-2026-X89J)." },
        { status: 400 }
      );
    }

    const report = await prisma.complaintReport.findUnique({
      where: { referenceNumber: ref },
      include: {
        issue: {
          select: {
            id: true,
            slug: true,
            title: true,
            companyId: true,
            category: true,
          },
        },
        evidence: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            reviewStatus: true,
            redactionStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report || report.isDeleted) {
      return NextResponse.json(
        { error: "No active complaint record found matching that reference number." },
        { status: 404 }
      );
    }

    // If an access key was provided, verify it for owner-level management
    if (accessKey) {
      const isKeyValid = verifyAccessKey(accessKey, report.accessKeyHash);
      if (!isKeyValid) {
        return NextResponse.json(
          {
            error: "The provided access key is invalid for this report reference.",
            isAuthorized: false,
            // Fall back to safe public summary only
            publicReport: toPublicReportDTO(report),
          },
          { status: 403 }
        );
      }

      // Valid access key: return full owner DTO
      return NextResponse.json({
        isAuthorized: true,
        report: toOwnerReportDTO(report),
      });
    }

    // No access key provided: return ONLY non-sensitive public projection
    return NextResponse.json({
      isAuthorized: false,
      publicReport: toPublicReportDTO(report),
      notice: "Public overview only. To edit, add evidence, or withdraw this report, provide the private access key issued at submission.",
    });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json(
      { error: "An error occurred while looking up report status." },
      { status: 500 }
    );
  }
}
