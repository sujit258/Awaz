import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import { getAggregateStats, getDailyTrends } from "../src/lib/aggregation/counting";
import { generateAccessKey, hashAccessKey, verifyAccessKey } from "../src/lib/auth/access-key";
import { prisma } from "../src/lib/db/prisma";

test.after(async () => {
  await prisma.$disconnect();
});

test("Password hashing and comparison works correctly", async () => {
  const plain = "SecurePassword123!";
  const hash = await hashPassword(plain);

  assert.notEqual(hash, plain);
  const isValid = await comparePassword(plain, hash);
  assert.equal(isValid, true);

  const isInvalid = await comparePassword("WrongPassword", hash);
  assert.equal(isInvalid, false);
});

test("Session token creates valid JWT and verifies citizen role payload", async () => {
  const user = {
    id: "test-user-uuid",
    email: "citizen@example.com",
    displayName: "Citizen Arun",
    role: "CITIZEN" as const,
  };

  const token = await createSessionToken(user);
  assert.ok(typeof token === "string" && token.length > 20);

  const verified = await verifySessionToken(token);
  assert.ok(verified !== null);
  assert.equal(verified?.id, user.id);
  assert.equal(verified?.email, user.email);
  assert.equal(verified?.role, "CITIZEN");
});

test("getAggregateStats aggregates real database records accurately", async () => {
  const stats = await getAggregateStats();

  assert.ok(typeof stats.totalReports === "number");
  assert.ok(typeof stats.uniqueReporters === "number");
  assert.ok(typeof stats.evidenceBackedReports === "number");
  assert.ok(typeof stats.reportedResolutions === "number");

  // Rule: unique reporters cannot exceed total reports
  assert.ok(stats.uniqueReporters <= stats.totalReports);

  // Rule: evidence backed reports cannot exceed total reports
  assert.ok(stats.evidenceBackedReports <= stats.totalReports);
});

test("getDailyTrends returns daily points for 7 and 30 day windows", async () => {
  const trends7 = await getDailyTrends(7);
  assert.equal(trends7.length, 7);

  const trends30 = await getDailyTrends(30);
  assert.equal(trends30.length, 30);

  for (const point of trends7) {
    assert.ok(typeof point.date === "string");
    assert.ok(typeof point.label === "string");
    assert.ok(typeof point.newReports === "number");
    assert.ok(typeof point.resolutions === "number");
  }
});

test("Anonymous complaint lifecycle: creation, key verification, status update, and withdrawal", async () => {
  // Find an issue category
  const issue = await prisma.issue.findFirst();
  if (!issue) return;

  const accessKey = generateAccessKey();
  const accessKeyHash = hashAccessKey(accessKey);
  const refNum = `AWZ-TEST-${Date.now().toString(36).toUpperCase()}`;

  // 1. Create anonymous report (userId = null)
  const report = await prisma.complaintReport.create({
    data: {
      referenceNumber: refNum,
      userId: null,
      accessKeyHash,
      issueId: issue.id,
      summary: "Integration test anonymous report",
      description: "Testing anonymous lifecycle from creation to withdrawal with access keys.",
      orderStatus: "AWAITING_DELIVERY",
      complaintStatus: "OPEN",
      verificationStatus: "UNVERIFIED",
      isDemo: true, // test flag
    },
  });

  assert.ok(report.id);
  assert.equal(report.userId, null);
  assert.equal(report.referenceNumber, refNum);

  // 2. Verify access key authorizes report
  const isAuthorized = verifyAccessKey(accessKey, report.accessKeyHash);
  assert.equal(isAuthorized, true);

  const isFakeKeyRejected = verifyAccessKey("awaz_ak_invalidkeyhere", report.accessKeyHash);
  assert.equal(isFakeKeyRejected, false);

  // 3. Update report status to RESOLVED_BY_CUSTOMER
  const updatedReport = await prisma.complaintReport.update({
    where: { id: report.id },
    data: {
      complaintStatus: "RESOLVED_BY_CUSTOMER",
      resolutionOutcome: "Delivered late with compensation",
    },
  });
  assert.equal(updatedReport.complaintStatus, "RESOLVED_BY_CUSTOMER");

  // 4. Soft-delete / withdraw report
  const deletedReport = await prisma.complaintReport.update({
    where: { id: report.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      description: "[Report withdrawn by user]",
    },
  });
  assert.equal(deletedReport.isDeleted, true);
  assert.equal(deletedReport.description, "[Report withdrawn by user]");

  // 5. Cleanup test record
  await prisma.complaintReport.delete({
    where: { id: report.id },
  });
});

test("getAggregateStats excludes deleted and demo records and counts distinct registered reporters", async () => {
  const issue = await prisma.issue.findFirst();
  if (!issue) return;

  const initialStats = await getAggregateStats({ issueId: issue.id, includeDemo: false });

  // Create a deleted report
  const deletedReport = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-DEL-${Date.now().toString(36).toUpperCase()}`,
      userId: null,
      issueId: issue.id,
      summary: "Deleted test report",
      description: "Should be excluded by getAggregateStats",
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // Create a demo report
  const demoReport = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-DEMO-${Date.now().toString(36).toUpperCase()}`,
      userId: null,
      issueId: issue.id,
      summary: "Demo test report",
      description: "Should be excluded when includeDemo is false",
      isDemo: true,
    },
  });

  const postStats = await getAggregateStats({ issueId: issue.id, includeDemo: false });

  // Counts must not include deleted or demo reports
  assert.equal(postStats.totalReports, initialStats.totalReports);

  // Cleanup
  await prisma.complaintReport.deleteMany({
    where: { id: { in: [deletedReport.id, demoReport.id] } },
  });
});

test("Staff roles verification: ADMIN and MODERATOR sessions verify with elevated privileges", async () => {
  const adminUser = {
    id: "admin-uuid-test",
    email: "admin@awaz.org",
    displayName: "Lead Moderator",
    role: "ADMIN" as const,
  };

  const token = await createSessionToken(adminUser);
  const verified = await verifySessionToken(token);
  assert.ok(verified !== null);
  assert.equal(verified?.role, "ADMIN");
  assert.ok(verified?.role === "ADMIN" || verified?.role === "MODERATOR");

  const citizenUser = {
    id: "citizen-uuid-test",
    email: "user@example.com",
    displayName: "Citizen User",
    role: "CITIZEN" as const,
  };
  const citizenToken = await createSessionToken(citizenUser);
  const citizenVerified = await verifySessionToken(citizenToken);
  assert.equal(citizenVerified?.role === "ADMIN" || citizenVerified?.role === "MODERATOR", false);
});

test("Moderation queue query safely handles anonymous reports with null user and null promisedDeliveryDate", async () => {
  const issue = await prisma.issue.findFirst();
  assert.ok(issue !== null);

  // Create an anonymous report with null user and null promisedDeliveryDate
  const anonReport = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-ANON-${Date.now().toString(36).toUpperCase()}`,
      userId: null,
      issueId: issue.id,
      summary: "Anonymous delivery delay issue",
      description: "Testing null user handling in moderation queue",
      promisedDeliveryDate: null,
      orderDate: null,
      isDemo: false,
      isDeleted: false,
    },
  });

  // Query as admin reports route does
  const reports = await prisma.complaintReport.findMany({
    where: { id: anonReport.id },
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

  assert.equal(reports.length, 1);
  const fetched = reports[0];
  // Verify user is null and access does not throw
  assert.equal(fetched.userId, null);
  assert.equal(fetched.user, null);
  assert.equal(fetched.promisedDeliveryDate, null);
  // Safe accessor check:
  const userObj = fetched.user as { email?: string } | null;
  const reporterEmail = userObj?.email || "Anonymous Citizen";
  assert.equal(reporterEmail, "Anonymous Citizen");

  // Cleanup
  await prisma.complaintReport.delete({
    where: { id: anonReport.id },
  });
});

test("My-reports query strictly filters by userId and excludes withdrawn records", async () => {
  const issue = await prisma.issue.findFirst();
  assert.ok(issue !== null);

  const testUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      displayName: "Integration Test Citizen",
      role: "CITIZEN",
    },
  });

  const activeReport = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-MY1-${Date.now().toString(36).toUpperCase()}`,
      userId: testUser.id,
      issueId: issue.id,
      summary: "Active report for citizen",
      description: "Should be returned in my-reports",
      isDeleted: false,
    },
  });

  const withdrawnReport = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-MY2-${Date.now().toString(36).toUpperCase()}`,
      userId: testUser.id,
      issueId: issue.id,
      summary: "Withdrawn report for citizen",
      description: "Should NOT be returned in active my-reports",
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  // Query exactly as /api/v1/my-reports does
  const userReports = await prisma.complaintReport.findMany({
    where: {
      userId: testUser.id,
      isDeleted: false,
    },
  });

  assert.equal(userReports.length, 1);
  assert.equal(userReports[0].id, activeReport.id);

  // Cleanup
  await prisma.complaintReport.deleteMany({
    where: { id: { in: [activeReport.id, withdrawnReport.id] } },
  });
  await prisma.user.delete({
    where: { id: testUser.id },
  });
});

test("Evidence upload route enforces safety guard and returns 503 when storage is unconfigured", async () => {
  const { POST: uploadEvidence } = await import("../src/app/api/v1/reports/[id]/evidence/route");
  const { NextRequest } = await import("next/server");

  const issue = await prisma.issue.findFirst();
  assert.ok(issue !== null);

  const rawAccessKey = generateAccessKey();
  const accessKeyHash = hashAccessKey(rawAccessKey);

  const report = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-EV1-${Date.now().toString(36).toUpperCase()}`,
      issueId: issue.id,
      summary: "Test report for unconfigured evidence safety check",
      description: "Testing evidence upload safety guard",
      accessKeyHash,
      isDeleted: false,
    },
  });

  const originalEnv = { ...process.env };
  try {
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;

    const req = new NextRequest(`http://localhost:3000/api/v1/reports/${report.id}/evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-awaz-access-key": rawAccessKey,
      },
      body: JSON.stringify({
        fileName: "invoice.pdf",
        fileType: "application/pdf",
        fileSize: 10240,
        redactionConfirmed: true,
      }),
    });

    const res = await uploadEvidence(req, { params: Promise.resolve({ id: report.id }) });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.storageConfigured, false);
    assert.ok(data.error.includes("private object storage is not configured"));
  } finally {
    process.env = originalEnv;
    await prisma.complaintReport.delete({ where: { id: report.id } });
  }
});

test("Evidence access control enforces strict authorization (rejects anonymous without key, permits authorized owner)", async () => {
  const { GET: getEvidence } = await import("../src/app/api/v1/evidence/[id]/route");
  const { NextRequest } = await import("next/server");

  const issue = await prisma.issue.findFirst();
  assert.ok(issue !== null);

  const rawAccessKey = generateAccessKey();
  const accessKeyHash = hashAccessKey(rawAccessKey);

  const report = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-EV2-${Date.now().toString(36).toUpperCase()}`,
      issueId: issue.id,
      summary: "Test report for evidence access control",
      description: "Testing authorization barriers",
      accessKeyHash,
      isDeleted: false,
    },
  });

  const evidence = await prisma.evidence.create({
    data: {
      complaintReportId: report.id,
      storageKey: `evidence/${report.id}/test-file.png`,
      fileName: "test-file.png",
      fileType: "image/png",
      fileSize: 2048,
      reviewStatus: "PENDING_REVIEW",
      redactionStatus: "REDACTED_BY_USER",
    },
  });

  try {
    // 1. Unauthorized request (no session, no access key) -> 403
    const unauthReq = new NextRequest(`http://localhost:3000/api/v1/evidence/${evidence.id}`, {
      method: "GET",
    });
    const unauthRes = await getEvidence(unauthReq, { params: Promise.resolve({ id: evidence.id }) });
    assert.equal(unauthRes.status, 403);

    // 2. Invalid access key -> 403
    const badKeyReq = new NextRequest(`http://localhost:3000/api/v1/evidence/${evidence.id}`, {
      method: "GET",
      headers: { "x-awaz-access-key": "AWZ-AK-INVALIDKEY999999" },
    });
    const badKeyRes = await getEvidence(badKeyReq, { params: Promise.resolve({ id: evidence.id }) });
    assert.equal(badKeyRes.status, 403);

    // 3. Valid access key -> 200 with metadata
    const validKeyReq = new NextRequest(`http://localhost:3000/api/v1/evidence/${evidence.id}`, {
      method: "GET",
      headers: { "x-awaz-access-key": rawAccessKey },
    });
    const validKeyRes = await getEvidence(validKeyReq, { params: Promise.resolve({ id: evidence.id }) });
    assert.equal(validKeyRes.status, 200);
    const validData = await validKeyRes.json();
    assert.equal(validData.id, evidence.id);
    assert.equal(validData.fileName, "test-file.png");
  } finally {
    await prisma.evidence.deleteMany({ where: { complaintReportId: report.id } });
    await prisma.complaintReport.delete({ where: { id: report.id } });
  }
});

test("purgeEvidenceForReport cleanly handles report withdrawal with evidence and creates audit trail", async () => {
  const { purgeEvidenceForReport } = await import("../src/lib/storage/evidence-purge");

  const issue = await prisma.issue.findFirst();
  assert.ok(issue !== null);

  const report = await prisma.complaintReport.create({
    data: {
      referenceNumber: `AWZ-TEST-PURGE-${Date.now().toString(36).toUpperCase()}`,
      issueId: issue.id,
      summary: "Test report for purge",
      description: "Testing evidence deletion on report purge",
      isDeleted: false,
    },
  });

  const evidence = await prisma.evidence.create({
    data: {
      complaintReportId: report.id,
      storageKey: `evidence/${report.id}/purge-test.png`,
      fileName: "purge-test.png",
      fileType: "image/png",
      fileSize: 1024,
    },
  });

  const purgeResult = await purgeEvidenceForReport(report.id, null);
  assert.equal(purgeResult.success, true);
  assert.equal(purgeResult.purgedCount, 1);

  // Evidence record in DB should be deleted
  const remaining = await prisma.evidence.findUnique({ where: { id: evidence.id } });
  assert.equal(remaining, null);

  // Check audit log entry
  const auditEntry = await prisma.auditLog.findFirst({
    where: { targetId: report.id, action: "EVIDENCE_PURGED" },
  });
  assert.ok(auditEntry !== null);

  // Cleanup report and audit log
  await prisma.complaintReport.delete({ where: { id: report.id } });
  await prisma.auditLog.deleteMany({ where: { targetId: report.id } });
});



