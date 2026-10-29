import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../src/lib/auth/session";
import { getAggregateStats, getDailyTrends } from "../src/lib/aggregation/counting";
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
