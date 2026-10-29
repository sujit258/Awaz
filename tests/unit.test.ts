import test from "node:test";
import assert from "node:assert/strict";
import { calculateTextSimilarity } from "../src/lib/antispam/duplicates";
import { checkRateLimit } from "../src/lib/antispam/rate-limit";
import { ComplaintSubmissionSchema } from "../src/lib/validation/schemas";

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

test("ComplaintSubmissionSchema rejects submissions without promised delivery date", () => {
  const invalidPayload = {
    issueId: "123e4567-e89b-12d3-a456-426614174000",
    companyId: "flipkart",
    promisedDeliveryDate: "",
    summary: "Order is delayed by three days",
    description: "Detailed description of the issue occurring at the local courier hub.",
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
    promisedDeliveryDate: "2026-10-25",
    summary: "Order delayed by 3 days at warehouse",
    description: "The package was scheduled for delivery on the 25th but no update has occurred.",
    confirmationAccurate: false, // Must be true
    confirmationConsent: true,
  };

  const result = ComplaintSubmissionSchema.safeParse(invalidPayload);
  assert.equal(result.success, false);
});

test("ComplaintSubmissionSchema accepts valid compliant payload", () => {
  const validPayload = {
    issueId: "123e4567-e89b-12d3-a456-426614174000",
    companyId: "flipkart",
    promisedDeliveryDate: "2026-10-25",
    summary: "Order delayed by 3 days with no tracking updates",
    description: "The package was scheduled for delivery on the 25th but has remained at hub without movement.",
    orderStatus: "AWAITING_DELIVERY",
    confirmationAccurate: true,
    confirmationConsent: true,
  };

  const result = ComplaintSubmissionSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});
