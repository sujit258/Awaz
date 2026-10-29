import test from "node:test";
import assert from "node:assert/strict";
import { calculateTextSimilarity } from "../src/lib/antispam/duplicates";
import { checkRateLimit } from "../src/lib/antispam/rate-limit";
import { ComplaintSubmissionSchema } from "../src/lib/validation/schemas";
import { generateAccessKey, hashAccessKey, verifyAccessKey } from "../src/lib/auth/access-key";
import { toPublicReportDTO } from "../src/lib/dto/report";

test("calculateTextSimilarity returns 1.0 for identical sentences", () => {
  const textA = "My Flipkart order has been delayed for 4 days without tracking updates.";
  const textB = "My Flipkart order has been delayed for 4 days without tracking updates.";
  const similarity = calculateTextSimilarity(textA, textB);
  assert.equal(similarity, 1.0);
});

test("calculateTextSimilarity returns high score for slight rephrasing", () => {
  const textA = "Flipkart package delayed by four days and support bot closes chat";
  const textB = "Flipkart package delayed by four days support bot closed chat";
  const similarity = calculateTextSimilarity(textA, textB);
  assert.ok(similarity > 0.7);
});

test("calculateTextSimilarity returns low score for distinct complaints", () => {
  const textA = "Smartphone delivery delayed for three days in Mumbai";
  const textB = "Refrigerator arrived with cracked glass door during transit";
  const similarity = calculateTextSimilarity(textA, textB);
  assert.ok(similarity < 0.2);
});

test("checkRateLimit permits requests below threshold and blocks excess", () => {
  const id = `test-user-${Date.now()}`;
  const limit = 3;
  const windowMs = 5000;

  // Requests 1, 2, 3 should succeed
  const r1 = checkRateLimit(id, limit, windowMs);
  const r2 = checkRateLimit(id, limit, windowMs);
  const r3 = checkRateLimit(id, limit, windowMs);
  assert.equal(r1.allowed, true);
  assert.equal(r2.allowed, true);
  assert.equal(r3.allowed, true);

  // Request 4 should be throttled
  const r4 = checkRateLimit(id, limit, windowMs);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
});

test("ComplaintSubmissionSchema accepts anonymous submission without email, phone, or promised date", () => {
  const validAnonymousPayload = {
    issueId: "123e4567-e89b-12d3-a456-426614174000",
    companyId: "flipkart",
    description: "My order has been delayed for five days at the local hub with no status update.",
    confirmationAccurate: true,
    confirmationConsent: true,
  };

  const result = ComplaintSubmissionSchema.safeParse(validAnonymousPayload);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.orderStatus, "AWAITING_DELIVERY");
    assert.equal(result.data.contactEmail, undefined);
  }
});

test("ComplaintSubmissionSchema rejects descriptions under 20 characters", () => {
  const invalidPayload = {
    issueId: "123e4567-e89b-12d3-a456-426614174000",
    companyId: "flipkart",
    description: "Too short", // Less than 20 chars
    confirmationAccurate: true,
    confirmationConsent: true,
  };

  const result = ComplaintSubmissionSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
});

test("ComplaintSubmissionSchema rejects unconfirmed accuracy or consent", () => {
  const invalidPayload = {
    issueId: "123e4567-e89b-12d3-a456-426614174000",
    companyId: "flipkart",
    description: "The package was scheduled for delivery on the 25th but no update has occurred.",
    confirmationAccurate: false, // Must be true
    confirmationConsent: true,
  };

  const result = ComplaintSubmissionSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
});

test("Access key generation, cryptographic hashing, and constant-time verification work", () => {
  const key = generateAccessKey();
  assert.ok(key.startsWith("awaz_ak_"));
  assert.ok(key.length >= 40);

  const hash = hashAccessKey(key);
  assert.equal(hash.length, 64); // SHA-256 hex length
  assert.notEqual(key, hash);

  // Correct key verifies
  const isValid = verifyAccessKey(key, hash);
  assert.equal(isValid, true);

  // Incorrect or tampered key fails
  const isInvalid = verifyAccessKey("awaz_ak_tampered_key_with_wrong_entropy", hash);
  assert.equal(isInvalid, false);

  // Null/empty checks
  assert.equal(verifyAccessKey("", hash), false);
  assert.equal(verifyAccessKey(key, null), false);
});

test("toPublicReportDTO excludes private description, accessKeyHash, and contact details", () => {
  const rawReport = {
    id: "internal-uuid-1234",
    referenceNumber: "AWZ-2026-X89J",
    userId: "secret-user-id",
    accessKeyHash: "f6c59d997a3898bd03f9c642642a8b98",
    contactEmail: "citizen@example.com",
    contactPhone: "+919876543210",
    description: "Private sensitive description containing potential identifying details.",
    summary: "Order delayed at hub",
    orderStatus: "AWAITING_DELIVERY",
    complaintStatus: "OPEN",
    verificationStatus: "UNVERIFIED",
    approximateRegion: "Maharashtra",
    createdAt: new Date("2026-10-29T10:00:00Z"),
    hasMeaningfulUpdate: false,
    issue: {
      slug: "flipkart-delayed-delivery",
      title: "Delayed Delivery Beyond Promised Date",
    },
    evidence: [{ id: "ev-1" }],
  };

  const publicDTO = toPublicReportDTO(rawReport);

  // Public fields present
  assert.equal(publicDTO.referenceNumber, "AWZ-2026-X89J");
  assert.equal(publicDTO.issueSlug, "flipkart-delayed-delivery");
  assert.equal(publicDTO.verificationStatus, "UNVERIFIED");
  assert.equal(publicDTO.evidenceCount, 1);

  // Private fields strictly excluded
  const rawObj = publicDTO as unknown as Record<string, unknown>;
  assert.equal(rawObj.description, undefined);
  assert.equal(rawObj.userId, undefined);
  assert.equal(rawObj.accessKeyHash, undefined);
  assert.equal(rawObj.contactEmail, undefined);
  assert.equal(rawObj.contactPhone, undefined);
  assert.equal(rawObj.id, undefined);
});
