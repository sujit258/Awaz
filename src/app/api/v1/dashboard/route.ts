import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAggregateStats, getDailyTrends } from "@/lib/aggregation/counting";


export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range");
    const trendDays = rangeParam === "7" ? 7 : 30;

    // 1. Overall stats
    const stats = await getAggregateStats();

    // 2. Trend points for the selected range
    const trends = await getDailyTrends(trendDays);

    const isProduction = process.env.DEMO_MODE !== "true";

    // 3. Trending issues
    const issues = await prisma.issue.findMany({
      where: { publicationStatus: "PUBLISHED" },
      orderBy: { reports: { _count: "desc" } },
      take: 6,
      select: {
        id: true,
        slug: true,
        companyId: true,
        category: true,
        title: true,
        description: true,
        publicationStatus: true,
        publishedAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: {
              where: {
                isDeleted: false,
                verificationStatus: { not: "REJECTED" },
                ...(isProduction ? { isDemo: false } : {}),
              },
            },
            updates: true,
          },
        },
      },
    });

    // Compute accurate stats per issue
    const enhancedIssues = await Promise.all(
      issues.map(async (issue) => {
        const [evidenceCount, resolvedCount, registeredReporters, anonReporters, latestReport] =
          await Promise.all([
            prisma.complaintReport.count({
              where: {
                issueId: issue.id,
                isDeleted: false,
                verificationStatus: { in: ["EVIDENCE_SUBMITTED", "VERIFIED"] },
                ...(isProduction ? { isDemo: false } : {}),
              },
            }),
            prisma.complaintReport.count({
              where: {
                issueId: issue.id,
                isDeleted: false,
                complaintStatus: "RESOLVED_BY_CUSTOMER",
                ...(isProduction ? { isDemo: false } : {}),
              },
            }),
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
          ]);

        const uniqueReportersCount = registeredReporters.length + anonReporters;

        return {
          id: issue.id,
          slug: issue.slug,
          companyId: issue.companyId,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          publicationStatus: issue.publicationStatus,
          publishedAt: issue.publishedAt,
          updatedAt: issue.updatedAt,
          totalReports: issue._count.reports,
          uniqueReporters: uniqueReportersCount,
          evidenceBackedReports: evidenceCount,
          reportedResolved: resolvedCount,
          updateCount: issue._count.updates,
          latestReportAt: latestReport?.createdAt ? latestReport.createdAt.toISOString() : null,
        };
      })
    );

    // 4. Latest public timeline updates (safe, approved public content only)
    const latestUpdates = await prisma.issueUpdate.findMany({
      take: 5,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        updateType: true,
        publicContent: true,
        publishedAt: true,
        issue: {
          select: {
            id: true,
            slug: true,
            title: true,
            companyId: true,
          },
        },
      },
    });

    // Check if demo records exist
    const demoReportCount = await prisma.complaintReport.count({
      where: { isDemo: true },
    });

    const activeReportedIssues = enhancedIssues.filter((i) => i.totalReports > 0);

    return NextResponse.json({
      stats,
      trends,
      trendRange: trendDays,
      activeReportedIssues,
      trackedCategories: enhancedIssues,
      trendingIssues: enhancedIssues,
      latestUpdates,
      hasDemoData: demoReportCount > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to compute dashboard metrics." },
      { status: 500 }
    );
  }
}
