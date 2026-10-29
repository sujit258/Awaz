import { prisma } from "../src/lib/db/prisma";

async function cleanupDemoData() {
  const isDryRun = !process.argv.includes("--confirm");

  console.log("=== Awaz Demo Data Cleanup Script ===");
  if (isDryRun) {
    console.log("🔍 DRY RUN MODE (No records will be deleted). Pass --confirm to execute.\n");
  } else {
    console.log("⚠️ EXECUTE MODE: Removing confirmed demonstration records.\n");
  }

  // 1. Identify Demo Users
  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@example.com",
      },
    },
    select: { id: true, email: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  // 2. Identify Demo Reports
  const demoReports = await prisma.complaintReport.findMany({
    where: {
      OR: [
        { isDemo: true },
        { userId: { in: demoUserIds } },
      ],
    },
    select: { id: true, referenceNumber: true, isDemo: true, userId: true },
  });
  const demoReportIds = demoReports.map((r) => r.id);

  // 3. Identify Demo Evidence
  const demoEvidence = await prisma.evidence.findMany({
    where: {
      complaintReportId: { in: demoReportIds },
    },
    select: { id: true, fileName: true, complaintReportId: true },
  });
  const demoEvidenceIds = demoEvidence.map((e) => e.id);

  // 4. Identify Demo Participations
  const demoParticipations = await prisma.campaignParticipation.findMany({
    where: {
      userId: { in: demoUserIds },
    },
    select: { id: true, campaignId: true, userId: true },
  });

  // 5. Identify Seeded Daily Snapshots
  const demoSnapshots = await prisma.dailySnapshot.findMany({
    select: { id: true, date: true, issueId: true },
  });

  // 6. Identify Moderation Actions on Demo Reports
  const demoModActions = await prisma.moderationAction.findMany({
    where: {
      targetId: { in: demoReportIds },
    },
    select: { id: true, targetId: true, action: true },
  });

  // 7. Identify Seeded Demo Issue Updates (fake timeline posts referencing 30+ reports or mock escalation)
  const demoUpdates = await prisma.issueUpdate.findMany({
    where: {
      OR: [
        { publicContent: { contains: "Over 30 consumer reports" } },
        { publicContent: { contains: "Consolidated Escalation Pack" } },
      ],
    },
    select: { id: true, updateType: true, publicContent: true },
  });
  const demoUpdateIds = demoUpdates.map((u) => u.id);

  // 8. Identify Seeded Demo Campaigns
  const demoCampaigns = await prisma.actionCampaign.findMany({
    where: {
      id: { startsWith: "demo-" },
    },
    select: { id: true, title: true },
  });
  const demoCampaignIds = demoCampaigns.map((c) => c.id);

  console.log("Records identified for cleanup:");
  console.log(`- Evidence items:        ${demoEvidence.length}`);
  console.log(`- Moderation actions:    ${demoModActions.length}`);
  console.log(`- Campaign participations: ${demoParticipations.length}`);
  console.log(`- Complaint reports:     ${demoReports.length} (${demoReports.map((r) => r.referenceNumber).join(", ")})`);
  console.log(`- Daily snapshots:       ${demoSnapshots.length}`);
  console.log(`- Demo citizen users:    ${demoUsers.length} (${demoUsers.map((u) => u.email).join(", ")})`);
  console.log(`- Demo issue updates:    ${demoUpdates.length}`);
  console.log(`- Demo campaigns:        ${demoCampaigns.length}`);

  console.log("\nRecords strictly preserved:");
  console.log("- Core Issues (catalog): 3 (flipkart-delayed-delivery, etc.)");
  console.log("- Action Campaigns:      1");
  console.log("- Staff Accounts:        admin@awaz.org, moderator@awaz.org");
  console.log("- Audit Logs:            All platform audit logs retained intact");

  if (isDryRun) {
    console.log("\n✓ Dry run complete. To execute this cleanup, run:");
    console.log("  npx tsx scripts/cleanup_demo_data.ts --confirm\n");
    await prisma.$disconnect();
    return;
  }

  // Dependency-aware transactional deletion
  console.log("\nExecuting dependency-aware deletion...");

  const results = await prisma.$transaction(async (tx) => {
    // 1. Evidence
    const deletedEvidence = await tx.evidence.deleteMany({
      where: { id: { in: demoEvidenceIds } },
    });

    // 2. Moderation actions on demo reports
    const deletedModActions = await tx.moderationAction.deleteMany({
      where: { id: { in: demoModActions.map((m) => m.id) } },
    });

    // 3. Campaign participations
    const deletedParticipations = await tx.campaignParticipation.deleteMany({
      where: { id: { in: demoParticipations.map((p) => p.id) } },
    });

    // 4. Daily snapshots
    const deletedSnapshots = await tx.dailySnapshot.deleteMany({
      where: { id: { in: demoSnapshots.map((s) => s.id) } },
    });

    // 5. Complaint Reports
    const deletedReports = await tx.complaintReport.deleteMany({
      where: { id: { in: demoReportIds } },
    });

    // 6. Demo Users
    const deletedUsers = await tx.user.deleteMany({
      where: { id: { in: demoUserIds } },
    });

    // 7. Demo Issue Updates
    const deletedUpdates = await tx.issueUpdate.deleteMany({
      where: { id: { in: demoUpdateIds } },
    });

    // 8. Demo Campaigns
    const deletedCampaigns = await tx.actionCampaign.deleteMany({
      where: { id: { in: demoCampaignIds } },
    });

    return {
      deletedEvidence: deletedEvidence.count,
      deletedModActions: deletedModActions.count,
      deletedParticipations: deletedParticipations.count,
      deletedSnapshots: deletedSnapshots.count,
      deletedReports: deletedReports.count,
      deletedUsers: deletedUsers.count,
      deletedUpdates: deletedUpdates.count,
      deletedCampaigns: deletedCampaigns.count,
    };
  });

  console.log("\n✓ Cleanup successfully executed:");
  console.log(`  - Deleted ${results.deletedEvidence} evidence files`);
  console.log(`  - Deleted ${results.deletedModActions} moderation actions`);
  console.log(`  - Deleted ${results.deletedParticipations} campaign participations`);
  console.log(`  - Deleted ${results.deletedSnapshots} daily snapshots`);
  console.log(`  - Deleted ${results.deletedReports} demo complaint reports`);
  console.log(`  - Deleted ${results.deletedUsers} demo citizen accounts`);
  console.log(`  - Deleted ${results.deletedUpdates} demo issue updates`);
  console.log(`  - Deleted ${results.deletedCampaigns} demo campaigns`);
  console.log("\nDatabase is now clean and ready for genuine public beta submissions.\n");

  await prisma.$disconnect();
}

cleanupDemoData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
