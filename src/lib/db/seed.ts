import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Awaz database seed...");

  // 1. Create or update Default Admin & Moderator
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@awaz.org" },
    update: { role: "ADMIN", passwordHash },
    create: {
      email: "admin@awaz.org",
      displayName: "Awaz Lead Moderator",
      role: "ADMIN",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@awaz.org" },
    update: { role: "MODERATOR", passwordHash },
    create: {
      email: "moderator@awaz.org",
      displayName: "Awaz Verification Officer",
      role: "MODERATOR",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  const citizen1 = await prisma.user.upsert({
    where: { email: "arun.kumar@example.com" },
    update: { passwordHash },
    create: {
      email: "arun.kumar@example.com",
      displayName: "Arun K.",
      role: "CITIZEN",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  const citizen2 = await prisma.user.upsert({
    where: { email: "priya.sharma@example.com" },
    update: { passwordHash },
    create: {
      email: "priya.sharma@example.com",
      displayName: "Priya S.",
      role: "CITIZEN",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  const citizen3 = await prisma.user.upsert({
    where: { email: "rahul.deshmukh@example.com" },
    update: { passwordHash },
    create: {
      email: "rahul.deshmukh@example.com",
      displayName: "Rahul D.",
      role: "CITIZEN",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  const citizen4 = await prisma.user.upsert({
    where: { email: "ananya.sen@example.com" },
    update: { passwordHash },
    create: {
      email: "ananya.sen@example.com",
      displayName: "Ananya S.",
      role: "CITIZEN",
      passwordHash,
      verifiedAt: new Date(),
    },
  });

  // 2. Create Public Issues
  const issue1 = await prisma.issue.upsert({
    where: { slug: "flipkart-delayed-delivery" },
    update: {},
    create: {
      slug: "flipkart-delayed-delivery",
      companyId: "flipkart",
      category: "delayed_delivery",
      title: "Flipkart orders not delivered by the promised date",
      description:
        "Documenting consumer reports where confirmed orders have exceeded their scheduled delivery date without fulfillment or meaningful explanation.",
      publicationStatus: "PUBLISHED",
      publishedAt: subDays(new Date(), 45),
    },
  });

  const issue2 = await prisma.issue.upsert({
    where: { slug: "flipkart-tracking-not-updated" },
    update: {},
    create: {
      slug: "flipkart-tracking-not-updated",
      companyId: "flipkart",
      category: "tracking_stalled",
      title: "Tracking stalled or inaccurate courier handoff",
      description:
        "Reports where shipment status remains indefinitely 'Shipped' or loops in 'Out for Delivery' without physical courier delivery attempts.",
      publicationStatus: "PUBLISHED",
      publishedAt: subDays(new Date(), 30),
    },
  });

  const issue3 = await prisma.issue.upsert({
    where: { slug: "flipkart-unresponsive-support" },
    update: {},
    create: {
      slug: "flipkart-unresponsive-support",
      companyId: "flipkart",
      category: "no_support",
      title: "Unable to obtain meaningful support response",
      description:
        "Reports of automated chatbot loops terminating without human agent escalation or written explanation for delayed or missing orders.",
      publicationStatus: "PUBLISHED",
      publishedAt: subDays(new Date(), 20),
    },
  });

  // 3. Clear previous demo complaint reports
  await prisma.complaintReport.deleteMany({
    where: { isDemo: true },
  });

  // 4. Create Demonstration Reports
  const reportsData = [
    {
      referenceNumber: "AWZ-2026-F89A",
      userId: citizen1.id,
      issueId: issue1.id,
      orderDate: subDays(new Date(), 10),
      promisedDeliveryDate: subDays(new Date(), 4),
      orderStatus: "AWAITING_DELIVERY" as const,
      complaintStatus: "OPEN" as const,
      verificationStatus: "VERIFIED" as const,
      summary: "Electronics item delayed by 4 days with no revised ETA",
      description:
        "Ordered a home appliance with assured delivery promised on the 25th. The status shows 'In Transit' at regional hub for over 96 hours with no courier updates.",
      resolutionOutcome: "Delivery within 24 hours or unconditional refund.",
      approximateRegion: "Maharashtra",
      hasMeaningfulUpdate: false,
      isDemo: true,
      createdAt: subDays(new Date(), 3),
      evidence: [
        {
          storageKey: "evidence/demo-f89a-invoice.pdf",
          fileName: "order_invoice_redacted.pdf",
          fileType: "application/pdf",
          fileSize: 452100,
          reviewStatus: "VERIFIED" as const,
          redactionStatus: "VERIFIED_REDACTED" as const,
          reviewerId: moderator.id,
          reviewNote: "Confirmed order date and promised delivery date match report description.",
        },
      ],
    },
    {
      referenceNumber: "AWZ-2026-T42B",
      userId: citizen2.id,
      issueId: issue1.id,
      orderDate: subDays(new Date(), 14),
      promisedDeliveryDate: subDays(new Date(), 7),
      orderStatus: "DELIVERED" as const,
      complaintStatus: "RESOLVED_BY_CUSTOMER" as const,
      verificationStatus: "VERIFIED" as const,
      summary: "Delivery delayed 5 days past promise date, finally arrived yesterday",
      description:
        "Package arrived 5 days late after submitting grievance. Reporter confirmed receipt of undamaged goods.",
      resolutionOutcome: "Confirmed delivery received.",
      approximateRegion: "Karnataka",
      hasMeaningfulUpdate: true,
      isDemo: true,
      createdAt: subDays(new Date(), 6),
      updatedAt: subDays(new Date(), 1),
    },
    {
      referenceNumber: "AWZ-2026-M19C",
      userId: citizen3.id,
      issueId: issue1.id,
      orderDate: subDays(new Date(), 8),
      promisedDeliveryDate: subDays(new Date(), 2),
      orderStatus: "AWAITING_DELIVERY" as const,
      complaintStatus: "UNDER_REVIEW" as const,
      verificationStatus: "EVIDENCE_SUBMITTED" as const,
      summary: "Delivery promised 2 days ago; tracking shows returned to warehouse",
      description:
        "No delivery attempt was made at my address despite tracking stating 'Customer unavailable'. CCTV footage confirms no delivery agent visited.",
      resolutionOutcome: "Prompt re-attempt with active courier dispatch notification.",
      approximateRegion: "Delhi NCR",
      hasMeaningfulUpdate: false,
      isDemo: true,
      createdAt: subDays(new Date(), 2),
      evidence: [
        {
          storageKey: "evidence/demo-m19c-tracking.png",
          fileName: "tracking_log_screenshot.png",
          fileType: "image/png",
          fileSize: 284000,
          reviewStatus: "PENDING_REVIEW" as const,
          redactionStatus: "REDACTED_BY_USER" as const,
        },
      ],
    },
    {
      referenceNumber: "AWZ-2026-X77D",
      userId: citizen4.id,
      issueId: issue2.id,
      orderDate: subDays(new Date(), 12),
      promisedDeliveryDate: subDays(new Date(), 5),
      orderStatus: "AWAITING_DELIVERY" as const,
      complaintStatus: "OPEN" as const,
      verificationStatus: "VERIFIED" as const,
      summary: "Tracking frozen at sort center for 6 consecutive days",
      description:
        "Air-way bill number has not updated since dispatch from Bilaspur facility. Support rep gave generic 48-hour SLA that has expired twice.",
      resolutionOutcome: "Immediate physical tracking status or replacement dispatch.",
      approximateRegion: "West Bengal",
      hasMeaningfulUpdate: false,
      isDemo: true,
      createdAt: subDays(new Date(), 4),
    },
    {
      referenceNumber: "AWZ-2026-P33E",
      userId: citizen1.id,
      issueId: issue3.id,
      orderDate: subDays(new Date(), 6),
      promisedDeliveryDate: subDays(new Date(), 1),
      orderStatus: "AWAITING_DELIVERY" as const,
      complaintStatus: "OPEN" as const,
      verificationStatus: "EVIDENCE_SUBMITTED" as const,
      summary: "Automated chatbot closes ticket without connecting to support specialist",
      description:
        "Every attempt to query the delay prompts 'Please wait 24 hours' and auto-closes the active conversation.",
      resolutionOutcome: "Direct human representative callback.",
      approximateRegion: "Tamil Nadu",
      hasMeaningfulUpdate: false,
      isDemo: true,
      createdAt: subDays(new Date(), 1),
    },
  ];

  for (const reportData of reportsData) {
    const { evidence, ...reportFields } = reportData;
    const createdReport = await prisma.complaintReport.create({
      data: {
        ...reportFields,
        evidence: evidence
          ? {
              create: evidence,
            }
          : undefined,
      },
    });

    // Create an audit log for the report creation
    await prisma.auditLog.create({
      data: {
        actorId: reportFields.userId,
        action: "CREATE_REPORT",
        targetType: "REPORT",
        targetId: createdReport.id,
        metadata: JSON.stringify({ referenceNumber: createdReport.referenceNumber, isDemo: true }),
      },
    });
  }

  // 5. Create Action Campaign
  const campaign = await prisma.actionCampaign.upsert({
    where: { id: "demo-campaign-flipkart-delays" },
    update: {},
    create: {
      id: "demo-campaign-flipkart-delays",
      issueId: issue1.id,
      title: "Delivery Transparency & Accurate Fulfillment SLA Campaign",
      objective:
        "Consolidate verified delayed-order evidence into a formal representation submitted to the Consumer Grievance Cell and Flipkart executive escalations.",
      requestedAction:
        "1. Immediate SLA accountability with proactive delay notifications.\n2. Automatic compensation or unconditional cancellation if delayed > 72 hours.\n3. Transparent courier tracking timestamps with driver contact information.",
      status: "ACTIVE",
    },
  });

  // Add sample participations
  await prisma.campaignParticipation.upsert({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: citizen1.id,
      },
    },
    update: {},
    create: {
      campaignId: campaign.id,
      userId: citizen1.id,
    },
  });

  await prisma.campaignParticipation.upsert({
    where: {
      campaignId_userId: {
        campaignId: campaign.id,
        userId: citizen2.id,
      },
    },
    update: {},
    create: {
      campaignId: campaign.id,
      userId: citizen2.id,
    },
  });

  // 6. Create Issue Updates Timeline
  await prisma.issueUpdate.createMany({
    data: [
      {
        issueId: issue1.id,
        authorId: admin.id,
        updateType: "MILESTONE",
        publicContent:
          "Over 30 consumer reports documented across 6 Indian states. 82% of submitted reports contain verified order invoices and tracking screenshots.",
        publishedAt: subDays(new Date(), 5),
      },
      {
        issueId: issue1.id,
        authorId: moderator.id,
        updateType: "OFFICIAL_STATEMENT",
        publicContent:
          "Consolidated Escalation Pack prepared with anonymized statistics for submission to national consumer advocacy portals.",
        publishedAt: subDays(new Date(), 2),
      },
    ],
  });

  // 7. Seed Daily Snapshots for historical trends (past 14 days)
  for (let i = 14; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    await prisma.dailySnapshot.upsert({
      where: {
        issueId_date: {
          issueId: issue1.id,
          date,
        },
      },
      update: {},
      create: {
        issueId: issue1.id,
        date,
        eligibleReportCount: 15 + Math.floor(Math.sin(i) * 4) + (14 - i),
        uniqueReporterCount: 14 + Math.floor(Math.sin(i) * 3) + (14 - i),
        evidenceBackedCount: 10 + Math.floor(Math.sin(i) * 2) + Math.floor((14 - i) * 0.8),
        reportedResolvedCount: 3 + Math.floor((14 - i) * 0.4),
      },
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("Credentials seeded:");
  console.log("  Admin: admin@awaz.org / Password123!");
  console.log("  Moderator: moderator@awaz.org / Password123!");
  console.log("  Citizen: arun.kumar@example.com / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
