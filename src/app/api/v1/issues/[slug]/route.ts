import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAggregateStats, getDailyTrends } from "@/lib/aggregation/counting";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const issue = await prisma.issue.findUnique({
      where: { slug },
      include: {
        updates: {
          orderBy: { publishedAt: "desc" },
          take: 10,
          select: {
            id: true,
            updateType: true,
            publicContent: true,
            publishedAt: true,
          },
        },
        campaigns: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            objective: true,
            requestedAction: true,
            status: true,
            createdAt: true,
            _count: {
              select: { participations: { where: { withdrawnAt: null } } },
            },
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }

    // 1. Issue-specific aggregate statistics
    const stats = await getAggregateStats({ issueId: issue.id });

    // 2. 30-day and 7-day trends for this issue
    const trends30 = await getDailyTrends(30, issue.id);

    // 3. First and latest report dates
    const [firstReport, latestReport] = await Promise.all([
      prisma.complaintReport.findFirst({
        where: { issueId: issue.id, verificationStatus: { not: "REJECTED" } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.complaintReport.findFirst({
        where: { issueId: issue.id, verificationStatus: { not: "REJECTED" } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    // 4. Anonymized regional distribution
    const regionalReports = await prisma.complaintReport.groupBy({
      by: ["approximateRegion"],
      where: {
        issueId: issue.id,
        verificationStatus: { not: "REJECTED" },
        approximateRegion: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    });

    const regions = regionalReports.map((r) => ({
      region: r.approximateRegion || "Unspecified",
      count: r._count.id,
    }));

    return NextResponse.json({
      issue: {
        id: issue.id,
        slug: issue.slug,
        companyId: issue.companyId,
        category: issue.category,
        title: issue.title,
        description: issue.description,
        publishedAt: issue.publishedAt,
        updatedAt: issue.updatedAt,
      },
      stats,
      trends: trends30,
      firstReportDate: firstReport?.createdAt || null,
      latestReportDate: latestReport?.createdAt || null,
      regions,
      updates: issue.updates,
      campaigns: issue.campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        objective: c.objective,
        requestedAction: c.requestedAction,
        status: c.status,
        createdAt: c.createdAt,
        participantCount: c._count.participations,
      })),
    });
  } catch (error) {
    console.error("Issue detail API error:", error);
    return NextResponse.json(
      { error: "Failed to load issue details." },
      { status: 500 }
    );
  }
}
