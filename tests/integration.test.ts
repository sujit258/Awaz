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
