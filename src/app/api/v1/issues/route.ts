import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q");

    const where: Record<string, unknown> = {
      publicationStatus: "PUBLISHED",
    };

    if (category && category !== "all") {
      where.category = category;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    const isProduction = process.env.DEMO_MODE !== "true";

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            reports: {
              where: {
                isDeleted: false,
                verificationStatus: { not: "REJECTED" },
                ...(isProduction ? { isDemo: false } : {}),
              },
            },
            campaigns: {
              where: { status: "ACTIVE" },
            },
            updates: true,
          },
        },
      },
    });

    const enriched = await Promise.all(
      issues.map(async (issue) => {
        const evidenceCount = await prisma.complaintReport.count({
          where: {
            issueId: issue.id,
            isDeleted: false,
            verificationStatus: { in: ["EVIDENCE_SUBMITTED", "VERIFIED"] },
            ...(isProduction ? { isDemo: false } : {}),
          },
        });

        const [registeredReporters, anonReporters, latestReport, resolvedCount] = await Promise.all([
          prisma.complaintReport.findMany({
            where: {
              issueId: issue.id,
              isDeleted: false,
              userId: { not: null },
              verificationStatus: { not: "REJECTED" },
              ...(isProduction ? { isDemo: false } : {}),
            },
            select: { userId: true },
            distinct: ["userId"],
          }),
          prisma.complaintReport.count({
            where: {
              issueId: issue.id,
              isDeleted: false,
              userId: null,
              verificationStatus: { not: "REJECTED" },
              ...(isProduction ? { isDemo: false } : {}),
            },
          }),
          prisma.complaintReport.findFirst({
            where: {
              issueId: issue.id,
              isDeleted: false,
              verificationStatus: { not: "REJECTED" },
              ...(isProduction ? { isDemo: false } : {}),
            },
            orderBy: { createdAt: "desc" },
            select: { createdAt: true },
          }),
          prisma.complaintReport.count({
            where: {
              issueId: issue.id,
              isDeleted: false,
              complaintStatus: "RESOLVED_BY_CUSTOMER",
              ...(isProduction ? { isDemo: false } : {}),
            },
          }),
        ]);

        return {
          id: issue.id,
          slug: issue.slug,
          companyId: issue.companyId,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          publicationStatus: issue.publicationStatus,
          publishedAt: issue.publishedAt,
          totalReports: issue._count.reports,
          uniqueReporters: registeredReporters.length + anonReporters,
          evidenceBackedReports: evidenceCount,
          reportedResolved: resolvedCount,
          activeCampaignsCount: issue._count.campaigns,
          updatesCount: issue._count.updates,
          latestReportAt: latestReport?.createdAt ? latestReport.createdAt.toISOString() : null,
        };
      })
    );

    return NextResponse.json({ issues: enriched });
  } catch (error) {
    console.error("Issues API error:", error);
    return NextResponse.json(
      { error: "Failed to load issues directory." },
      { status: 500 }
    );
  }
}
