import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Access denied. Moderator privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const verificationStatus = searchParams.get("verificationStatus");
    const complaintStatus = searchParams.get("complaintStatus");
    const issueId = searchParams.get("issueId");
    const search = searchParams.get("q");

    const where: Record<string, unknown> = {};

    if (verificationStatus && verificationStatus !== "ALL") {
      where.verificationStatus = verificationStatus;
    }

    if (complaintStatus && complaintStatus !== "ALL") {
      where.complaintStatus = complaintStatus;
    }

    if (issueId && issueId !== "ALL") {
      where.issueId = issueId;
    }

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const reports = await prisma.complaintReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
          },
        },
        issue: {
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
          },
        },
        evidence: true,
      },
    });

    const pendingReviewCount = await prisma.complaintReport.count({
      where: { verificationStatus: "EVIDENCE_SUBMITTED" },
    });

    const unverifiedCount = await prisma.complaintReport.count({
      where: { verificationStatus: "UNVERIFIED" },
    });

    return NextResponse.json({
      reports,
      summary: {
        totalFiltered: reports.length,
        pendingReviewCount,
        unverifiedCount,
      },
    });
  } catch (error) {
    console.error("Admin reports error:", error);
    return NextResponse.json(
      { error: "Failed to load moderation reports." },
      { status: 500 }
    );
  }
}
