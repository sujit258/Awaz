import { prisma } from "../src/lib/db/prisma";
import * as fs from "fs";
import * as path from "path";

async function backupAndInspect() {
  console.log("=== Awaz Database Inspection & Backup ===");

  // 1. Inspect tables
  const [
    users,
    issues,
    reports,
    evidence,
    updates,
    campaigns,
    participations,
    snapshots,
    modActions,
    auditLogs,
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        accountStatus: true,
        createdAt: true,
        _count: { select: { reports: true, participations: true } },
      },
    }),
    prisma.issue.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        publicationStatus: true,
        _count: { select: { reports: true, updates: true, campaigns: true } },
      },
    }),
    prisma.complaintReport.findMany({
      select: {
        id: true,
        referenceNumber: true,
        userId: true,
        issueId: true,
        isDemo: true,
        verificationStatus: true,
        complaintStatus: true,
        orderStatus: true,
        approximateRegion: true,
        createdAt: true,
      },
    }),
    prisma.evidence.findMany({
      select: {
        id: true,
        complaintReportId: true,
        fileType: true,
        fileSize: true,
        redactionStatus: true,
        createdAt: true,
      },
    }),
    prisma.issueUpdate.findMany({
      select: {
        id: true,
        issueId: true,
        updateType: true,
        publicContent: true,
        publishedAt: true,
      },
    }),
    prisma.actionCampaign.findMany({
      select: {
        id: true,
        issueId: true,
        title: true,
        status: true,
        _count: { select: { participations: true } },
      },
    }),
    prisma.campaignParticipation.findMany({
      select: {
        id: true,
        campaignId: true,
        userId: true,
        joinedAt: true,
        withdrawnAt: true,
      },
    }),
    prisma.dailySnapshot.findMany({
      select: {
        id: true,
        issueId: true,
        date: true,
        eligibleReportCount: true,
        uniqueReporterCount: true,
        evidenceBackedCount: true,
        reportedResolvedCount: true,
      },
    }),
    prisma.moderationAction.findMany({
      select: {
        id: true,
        targetType: true,
        targetId: true,
        action: true,
        reason: true,
        adminId: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      select: {
        id: true,
        actorId: true,
        action: true,
        targetType: true,
        targetId: true,
        createdAt: true,
      },
    }),
  ]);

  // Analyze demo vs genuine
  const demoReports = reports.filter((r) => r.isDemo === true);
  const genuineReports = reports.filter((r) => r.isDemo === false);

  const demoUsers = users.filter(
    (u) =>
      u.email.endsWith("@example.com") ||
      u.email === "admin@awaz.org" ||
      u.email === "moderator@awaz.org"
  );
  const genuineUsers = users.filter(
    (u) =>
      !u.email.endsWith("@example.com") &&
      u.email !== "admin@awaz.org" &&
      u.email !== "moderator@awaz.org"
  );

  const summary = {
    timestamp: new Date().toISOString(),
    totals: {
      users: users.length,
      issues: issues.length,
      reports: reports.length,
      evidence: evidence.length,
      issueUpdates: updates.length,
      campaigns: campaigns.length,
      participations: participations.length,
      dailySnapshots: snapshots.length,
      moderationActions: modActions.length,
      auditLogs: auditLogs.length,
    },
    breakdown: {
      reports: {
        total: reports.length,
        demoCount: demoReports.length,
        genuineCount: genuineReports.length,
        demoReferences: demoReports.map((r) => r.referenceNumber),
        genuineReferences: genuineReports.map((r) => r.referenceNumber),
      },
      users: {
        total: users.length,
        demoCount: demoUsers.length,
        genuineCount: genuineUsers.length,
        demoUserEmails: demoUsers.map((u) => u.email),
        genuineUserEmails: genuineUsers.map((u) => u.email),
      },
      issueUpdates: {
        total: updates.length,
      },
    },
  };

  console.log("\n--- Database Inventory ---");
  console.log("Users:", summary.totals.users, `(${demoUsers.length} demo, ${genuineUsers.length} genuine)`);
  console.log("Issues:", summary.totals.issues, "(core category directory)");
  console.log("Reports:", summary.totals.reports, `(${demoReports.length} demo, ${genuineReports.length} genuine)`);
  console.log("Evidence items:", summary.totals.evidence);
  console.log("Issue Updates:", summary.totals.issueUpdates);
  console.log("Campaigns:", summary.totals.campaigns);
  console.log("Participations:", summary.totals.participations);
  console.log("Daily Snapshots:", summary.totals.dailySnapshots);
  console.log("Moderation Actions:", summary.totals.moderationActions);
  console.log("Audit Logs:", summary.totals.auditLogs);

  // 2. Perform Full Backup
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFilePath = path.join(backupDir, `db_backup_${timestampStr}.json`);

  // Fetch full records including sensitive fields for backup only
  const fullBackup = {
    metadata: {
      createdAt: new Date().toISOString(),
      database: "Awaz Neon PostgreSQL",
      nodeEnv: process.env.NODE_ENV,
      summary,
    },
    tables: {
      users: await prisma.user.findMany(),
      issues: await prisma.issue.findMany(),
      reports: await prisma.complaintReport.findMany(),
      evidence: await prisma.evidence.findMany(),
      issueUpdates: await prisma.issueUpdate.findMany(),
      actionCampaigns: await prisma.actionCampaign.findMany(),
      campaignParticipations: await prisma.campaignParticipation.findMany(),
      dailySnapshots: await prisma.dailySnapshot.findMany(),
      moderationActions: await prisma.moderationAction.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
    },
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(fullBackup, null, 2), "utf-8");
  console.log(`\n✓ Complete database backup saved successfully to: ${backupFilePath}`);
  console.log(`✓ Backup size: ${(fs.statSync(backupFilePath).size / 1024).toFixed(2)} KB`);

  await prisma.$disconnect();
}

backupAndInspect().catch((err) => {
  console.error("Backup & inspection failed:", err);
  process.exit(1);
});
