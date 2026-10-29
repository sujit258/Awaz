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

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            reports: {
              where: { verificationStatus: { not: "REJECTED" } },
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
            verificationStatus: { in: ["EVIDENCE_SUBMITTED", "VERIFIED"] },
          },
        });

        const uniqueReporters = await prisma.complaintReport.findMany({
          where: {
            issueId: issue.id,
            verificationStatus: { not: "REJECTED" },
          },
          select: { userId: true },
          distinct: ["userId"],
        });

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
          uniqueReporters: uniqueReporters.length,
          evidenceBackedReports: evidenceCount,
          activeCampaignsCount: issue._count.campaigns,
          updatesCount: issue._count.updates,
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
