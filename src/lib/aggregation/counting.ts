import { prisma } from "@/lib/db/prisma";
import { subDays, startOfDay, format } from "date-fns";

export interface AggregateStats {
  totalReports: number;
  uniqueReporters: number;
  evidenceBackedReports: number;
  reportedResolutions: number;
  openReports: number;
  underReviewReports: number;
  disputedReports: number;
  resolutionRatePct: number;
}

export interface DailyTrendPoint {
  date: string; // YYYY-MM-DD
  label: string; // "Oct 22"
  newReports: number;
  resolutions: number;
}

/**
 * Calculates accurate aggregated statistics for an issue or platform-wide.
 * Enforces the published methodology:
 * 1. Excludes reports with verificationStatus = REJECTED
 * 2. Distinct counting for unique reporters
 * 3. Evidence-backed = report has associated evidence or verificationStatus in (EVIDENCE_SUBMITTED, VERIFIED)
 * 4. Resolutions = confirmed by the reporting customer (RESOLVED_BY_CUSTOMER)
 */
export async function getAggregateStats(options?: {
  issueId?: string;
  startDate?: Date;
  endDate?: Date;
  includeDemo?: boolean;
}): Promise<AggregateStats> {
  const whereClause: Record<string, unknown> = {
    isDeleted: false,
    verificationStatus: {
      not: "REJECTED",
    },
  };

  if (options?.includeDemo !== true && process.env.DEMO_MODE !== "true") {
    whereClause.isDemo = false;
  }

  if (options?.issueId) {
    whereClause.issueId = options.issueId;
  }

  if (options?.startDate || options?.endDate) {
    whereClause.createdAt = {
      ...(options?.startDate ? { gte: options.startDate } : {}),
      ...(options?.endDate ? { lte: options.endDate } : {}),
    };
  }

  const [
    totalReports,
    registeredUsersResult,
    anonymousReportsCount,
    evidenceBackedReports,
    reportedResolutions,
    openReports,
    underReviewReports,
    disputedReports,
  ] = await Promise.all([
    // 1. Total eligible reports
    prisma.complaintReport.count({
      where: whereClause,
    }),

    // 2. Distinct registered reporters
    prisma.complaintReport.findMany({
      where: { ...whereClause, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    }),

    // 3. Anonymous reports (each counted as distinct reporter)
    prisma.complaintReport.count({
      where: { ...whereClause, userId: null },
    }),

    // 4. Evidence-backed reports
    prisma.complaintReport.count({
      where: {
        ...whereClause,
        OR: [
          { verificationStatus: { in: ["EVIDENCE_SUBMITTED", "VERIFIED"] } },
          { evidence: { some: {} } },
        ],
      },
    }),

    // 5. Reported resolutions
    prisma.complaintReport.count({
      where: {
        ...whereClause,
        complaintStatus: "RESOLVED_BY_CUSTOMER",
      },
    }),

    // 6. Open reports
    prisma.complaintReport.count({
      where: {
        ...whereClause,
        complaintStatus: "OPEN",
      },
    }),

    // 7. Under review reports
    prisma.complaintReport.count({
      where: {
        ...whereClause,
        complaintStatus: "UNDER_REVIEW",
      },
    }),

    // 8. Disputed reports
    prisma.complaintReport.count({
      where: {
        ...whereClause,
        complaintStatus: "DISPUTED",
      },
    }),
  ]);

  const uniqueReporters = registeredUsersResult.length + anonymousReportsCount;
  const resolutionRatePct =
    totalReports > 0 ? Math.round((reportedResolutions / totalReports) * 1000) / 10 : 0;

  return {
    totalReports,
    uniqueReporters,
    evidenceBackedReports,
    reportedResolutions,
    openReports,
    underReviewReports,
    disputedReports,
    resolutionRatePct,
  };
}

/**
 * Computes daily submission and resolution trends for the past N days.
 */
export async function getDailyTrends(
  days: 7 | 30 = 30,
  issueId?: string,
  includeDemo?: boolean
): Promise<DailyTrendPoint[]> {
  const now = new Date();
  const startDate = startOfDay(subDays(now, days - 1));

  const whereClause: Record<string, unknown> = {
    createdAt: { gte: startDate },
    isDeleted: false,
    verificationStatus: { not: "REJECTED" },
  };

  if (includeDemo !== true && process.env.DEMO_MODE !== "true") {
    whereClause.isDemo = false;
  }

  if (issueId) {
    whereClause.issueId = issueId;
  }

  const reports = await prisma.complaintReport.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      complaintStatus: true,
      updatedAt: true,
    },
  });

  // Map dates to counts
  const trendMap: Record<string, { newReports: number; resolutions: number; label: string }> = {};

  for (let i = 0; i < days; i++) {
    const d = subDays(now, days - 1 - i);
    const key = format(d, "yyyy-MM-dd");
    const label = format(d, days === 7 ? "EEE, MMM d" : "MMM d");
    trendMap[key] = { newReports: 0, resolutions: 0, label };
  }

  for (const report of reports) {
    const createdKey = format(report.createdAt, "yyyy-MM-dd");
    if (trendMap[createdKey]) {
      trendMap[createdKey].newReports += 1;
    }

    if (report.complaintStatus === "RESOLVED_BY_CUSTOMER") {
      const resolvedKey = format(report.updatedAt, "yyyy-MM-dd");
      if (trendMap[resolvedKey]) {
        trendMap[resolvedKey].resolutions += 1;
      }
    }
  }

  return Object.entries(trendMap).map(([date, data]) => ({
    date,
    label: data.label,
    newReports: data.newReports,
    resolutions: data.resolutions,
  }));
}
