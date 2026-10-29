import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAggregateStats } from "@/lib/aggregation/counting";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const formatType = searchParams.get("format") || "json";

    const issue = await prisma.issue.findUnique({
      where: { slug },
      include: {
        campaigns: {
          where: { status: "ACTIVE" },
          take: 1,
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const stats = await getAggregateStats({ issueId: issue.id });

    const isProduction = process.env.DEMO_MODE !== "true";

    const [firstReport, latestReport] = await Promise.all([
      prisma.complaintReport.findFirst({
        where: {
          issueId: issue.id,
          isDeleted: false,
          verificationStatus: { not: "REJECTED" },
          ...(isProduction ? { isDemo: false } : {}),
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
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

    const regionalGroups = await prisma.complaintReport.groupBy({
      by: ["approximateRegion"],
      where: {
        issueId: issue.id,
        isDeleted: false,
        verificationStatus: { not: "REJECTED" },
        approximateRegion: { not: null },
        ...(isProduction ? { isDemo: false } : {}),
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    });

    const reportDate = format(new Date(), "MMMM d, yyyy");
    const periodStart = firstReport?.createdAt
      ? format(firstReport.createdAt, "MMM d, yyyy")
      : "N/A";
    const periodEnd = latestReport?.createdAt
      ? format(latestReport.createdAt, "MMM d, yyyy")
      : "N/A";

    const activeCampaign = issue.campaigns[0];

    const reportPayload = {
      title: `Consolidated Consumer Evidence Pack: ${issue.title}`,
      referenceNumber: `AWAZ-EP-${issue.companyId.toUpperCase()}-${format(new Date(), "yyyyMMdd")}`,
      publishedDate: reportDate,
      company: "Flipkart Internet Private Limited",
      category: issue.category,
      reportingPeriod: `${periodStart} to ${periodEnd}`,
      executiveSummary: `This factual evidence pack synthesizes verified consumer complaints regarding ${issue.title}. It has been compiled independently by the Awaz platform from verified consumer submissions and redacted documentation. It is intended for submission to corporate grievance officers and regulatory consumer dispute redressal commissions.`,
      metrics: {
        totalEligibleReports: stats.totalReports,
        uniqueReporters: stats.uniqueReporters,
        evidenceBackedReports: stats.evidenceBackedReports,
        evidenceBackingPercentage:
          stats.totalReports > 0
            ? `${Math.round((stats.evidenceBackedReports / stats.totalReports) * 100)}%`
            : "0%",
        customerConfirmedResolutions: stats.reportedResolutions,
        resolutionRatePercentage: `${stats.resolutionRatePct}%`,
        openGrievances: stats.openReports,
      },
      geographicDistribution: regionalGroups.map((g) => ({
        state: g.approximateRegion || "Unspecified",
        reports: g._count.id,
      })),
      requestedRedressalActions: activeCampaign
        ? activeCampaign.requestedAction
        : "1. Provide accurate delivery timestamp and active courier tracking.\n2. Automatic compensation or cancellation option for delays exceeding 72 hours.\n3. Transparent escalation channel for unresolved shipment queries.",
      legalDisclaimer:
        "Awaz is an independent consumer interest platform and is not affiliated with, endorsed by, or operated by Flipkart. The data herein reflects voluntary consumer submissions under the Awaz Verification Standard. Awaz does not adjudicate legal liability.",
      grievanceAuthorityResources: [
        {
          name: "National Consumer Helpline (NCH)",
          portal: "https://consumerhelpline.gov.in",
          tollFree: "1915 or 1800-11-4000",
        },
        {
          name: "e-Daakhil Consumer Commission Portal",
          portal: "https://edaakhil.nic.in",
          purpose: "Filing consumer disputes before District/State/National Commissions",
        },
        {
          name: "Flipkart Grievance Redressal",
          contact: "grievance.officer@flipkart.com",
        },
      ],
      methodologyUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/methodology`,
      publicIssueUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/issues/${issue.slug}`,
    };

    if (formatType === "text") {
      const textSummary = `
================================================================================
AWAZ CONSOLIDATED CONSUMER EVIDENCE PACK
Reference: ${reportPayload.referenceNumber}
Date: ${reportPayload.publishedDate}
Subject: ${reportPayload.title}
Target Entity: ${reportPayload.company}
Reporting Window: ${reportPayload.reportingPeriod}
================================================================================

1. EXECUTIVE SUMMARY
${reportPayload.executiveSummary}

2. VERIFIED AGGREGATE METRICS
- Total Eligible Consumer Reports: ${reportPayload.metrics.totalEligibleReports}
- Distinct Unique Reporters: ${reportPayload.metrics.uniqueReporters}
- Evidence-Backed Submissions: ${reportPayload.metrics.evidenceBackedReports} (${reportPayload.metrics.evidenceBackingPercentage})
- Customer-Confirmed Resolutions: ${reportPayload.metrics.customerConfirmedResolutions} (${reportPayload.metrics.resolutionRatePercentage})
- Currently Open Grievances: ${reportPayload.metrics.openGrievances}

3. REQUESTED CORRECTIVE ACTIONS
${reportPayload.requestedRedressalActions}

4. OFFICIAL ESCALATION & GRIEVANCE CHANNELS
- National Consumer Helpline (NCH): Toll-Free 1915 / consumerhelpline.gov.in
- e-Daakhil Online Commission Redressal: edaakhil.nic.in
- Company Grievance Officer: grievance.officer@flipkart.com

5. METHODOLOGY & STATISTICAL INTEGRITY
Data compiled under the Awaz Consumer Evidence Standard:
${reportPayload.methodologyUrl}
Public Record: ${reportPayload.publicIssueUrl}

================================================================================
DISCLAIMER: ${reportPayload.legalDisclaimer}
================================================================================
      `.trim();

      return new NextResponse(textSummary, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${reportPayload.referenceNumber}.txt"`,
        },
      });
    }

    return NextResponse.json(reportPayload);
  } catch (error) {
    console.error("Escalation report generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate escalation pack." },
      { status: 500 }
    );
  }
}
