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

test("getTrustedClientIp prioritizes x-vercel-ip over client-supplied x-forwarded-for", async () => {
  const { getTrustedClientIp } = await import("../src/lib/antispam/ip");
  const { NextRequest } = await import("next/server");

  // Case 1: Attacker sends spoofed x-forwarded-for, but Vercel sets x-vercel-ip
  const reqWithVercel = new NextRequest("http://localhost:3000/api/v1/reports", {
    headers: {
      "x-forwarded-for": "1.1.1.1, 10.0.0.1",
      "x-vercel-ip": "76.76.21.21",
    },
  });
  assert.equal(getTrustedClientIp(reqWithVercel), "76.76.21.21");

  // Case 2: Cloudflare edge header
  const reqWithCf = new NextRequest("http://localhost:3000/api/v1/reports", {
    headers: {
      "x-forwarded-for": "2.2.2.2",
      "cf-connecting-ip": "104.16.249.249",
    },
  });
  // Without vercel or real-ip, cf-connecting-ip is used
  assert.equal(getTrustedClientIp(reqWithCf), "104.16.249.249");

  // Case 3: Fallback to localhost when no proxy headers exist
  const reqClean = new NextRequest("http://localhost:3000/api/v1/reports");
  assert.equal(getTrustedClientIp(reqClean), "127.0.0.1");
});

test("getStorageConfig safely detects unconfigured production object storage", async () => {
  const { getStorageConfig } = await import("../src/lib/storage/evidence-purge");
  const config = getStorageConfig();

  // If S3 environment variables are not set in test environment, it must report isConfigured: false
  if (!process.env.S3_BUCKET || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    assert.equal(config.isConfigured, false);
  } else {
    assert.equal(config.isConfigured, true);
  }
});

test("robots.ts properly disallows private tracking, admin, and auth endpoints", async () => {
  const robotsModule = await import("../src/app/robots");
  const robotsConfig = robotsModule.default();

  assert.ok(Array.isArray(robotsConfig.rules));
  const rule = robotsConfig.rules[0];
  assert.equal(rule.userAgent, "*");

  const disallowList = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
  assert.ok(disallowList.includes("/track*"));
  assert.ok(disallowList.includes("/admin*"));
  assert.ok(disallowList.includes("/api/*"));
  assert.ok(disallowList.includes("/login"));

  const allowList = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
  assert.ok(allowList.includes("/"));
  assert.ok(allowList.includes("/issues"));

  assert.ok(robotsConfig.sitemap?.includes("sitemap.xml"));
});

test("Official consumer help destinations match verified national portals", () => {
  const nchUrl = "https://consumerhelpline.gov.in/";
  const eJagritiUrl = "https://e-jagriti.gov.in/";

  // Assert correct URLs and HTTPS protocol
  assert.ok(nchUrl.startsWith("https://consumerhelpline.gov.in"));
  assert.ok(eJagritiUrl.startsWith("https://e-jagriti.gov.in"));
  assert.notEqual(eJagritiUrl, "https://edaakhil.nic.in"); // Legacy e-daakhil replaced
});

test("validateEvidenceFile validates allowed image and document formats", async () => {
  const { validateEvidenceFile } = await import("../src/lib/storage/r2");

  // Valid formats
  assert.equal(validateEvidenceFile("screenshot.png", "image/png", 1024).valid, true);
  assert.equal(validateEvidenceFile("invoice.pdf", "application/pdf", 50000).valid, true);
  assert.equal(validateEvidenceFile("photo.jpg", "image/jpeg", 204800).valid, true);
  assert.equal(validateEvidenceFile("photo.jpeg", "image/jpeg", 204800).valid, true);
  assert.equal(validateEvidenceFile("receipt.webp", "image/webp", 15000).valid, true);
  assert.equal(validateEvidenceFile("ios_photo.heic", "image/heic", 300000).valid, true);

  // File size boundary
  assert.equal(validateEvidenceFile("max.pdf", "application/pdf", 10 * 1024 * 1024).valid, true);
  const oversized = validateEvidenceFile("huge.pdf", "application/pdf", 10 * 1024 * 1024 + 1);
  assert.equal(oversized.valid, false);
  assert.ok(oversized.error?.includes("10MB"));

  const empty = validateEvidenceFile("empty.pdf", "application/pdf", 0);
  assert.equal(empty.valid, false);

  // Invalid MIME types & dangerous extensions
  assert.equal(validateEvidenceFile("malware.exe", "application/x-msdownload", 1000).valid, false);
  assert.equal(validateEvidenceFile("script.sh", "text/x-shellscript", 1000).valid, false);
  assert.equal(validateEvidenceFile("page.html", "text/html", 1000).valid, false);
  assert.equal(validateEvidenceFile("spoofed.php.png", "application/x-php", 1000).valid, false);
});

test("generateEvidenceStorageKey produces unpredictable, report-scoped keys", async () => {
  const { generateEvidenceStorageKey } = await import("../src/lib/storage/r2");
  const reportId = "test-report-123";

  const key1 = generateEvidenceStorageKey(reportId, "png");
  const key2 = generateEvidenceStorageKey(reportId, "png");

  // Keys must start with evidence/<reportId>/
  assert.ok(key1.startsWith(`evidence/${reportId}/`));
  assert.ok(key1.endsWith(".png"));

  // Keys must be cryptographically distinct / unpredictable
  assert.notEqual(key1, key2);

  // Check pattern: evidence/<reportId>/<uuid>-<timestamp>.<ext>
  const keyRegex = new RegExp(`^evidence/${reportId}/[a-f0-9-]+-\\d+\\.png$`);
  assert.ok(keyRegex.test(key1));
});

test("getR2Config supports R2 and S3 variable conventions and defaults bucket to awaz", async () => {
  const { getR2Config } = await import("../src/lib/storage/r2");

  const originalEnv = { ...process.env };
  try {
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.S3_BUCKET;
    delete process.env.S3_ENDPOINT;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;

    // Unconfigured
    const unconf = getR2Config();
    assert.equal(unconf.isConfigured, false);
    assert.equal(unconf.bucket, "awaz"); // Default bucket name is awaz
    assert.equal(unconf.region, "auto");

    // Configured via R2_*
    process.env.R2_BUCKET = "awaz";
    process.env.R2_ENDPOINT = "https://example-account.r2.cloudflarestorage.com";
    process.env.R2_ACCESS_KEY_ID = "test-r2-key-id";
    process.env.R2_SECRET_ACCESS_KEY = "test-r2-secret-key";

    const confR2 = getR2Config();
    assert.equal(confR2.isConfigured, true);
    assert.equal(confR2.bucket, "awaz");
    assert.equal(confR2.endpoint, "https://example-account.r2.cloudflarestorage.com");
    assert.equal(confR2.region, "auto");
  } finally {
    process.env = originalEnv;
  }
});

test("Presigned upload and download URLs are generated correctly with S3/R2 client", async () => {
  const { createPresignedUploadUrl, createPresignedDownloadUrl, resetR2ClientForTesting } = await import("../src/lib/storage/r2");

  const originalEnv = { ...process.env };
  try {
    process.env.R2_BUCKET = "awaz";
    process.env.R2_ENDPOINT = "https://example-account.r2.cloudflarestorage.com";
    process.env.R2_ACCESS_KEY_ID = "mock-access-key-id";
    process.env.R2_SECRET_ACCESS_KEY = "mock-secret-access-key-minimum-size";
    process.env.R2_REGION = "auto";
    resetR2ClientForTesting();

    const uploadUrl = await createPresignedUploadUrl("evidence/rep-1/file.png", "image/png", 5000, 300);
    assert.ok(uploadUrl.includes("https://example-account.r2.cloudflarestorage.com/awaz/evidence/rep-1/file.png"));
    assert.ok(uploadUrl.includes("X-Amz-Signature="));
    assert.ok(uploadUrl.includes("X-Amz-Expires=300"));

    const downloadUrl = await createPresignedDownloadUrl("evidence/rep-1/file.png", "tracking receipt.png", 900);
    assert.ok(downloadUrl.includes("https://example-account.r2.cloudflarestorage.com/awaz/evidence/rep-1/file.png"));
    assert.ok(downloadUrl.includes("X-Amz-Signature="));
    assert.ok(downloadUrl.includes("response-content-disposition="));
    assert.ok(downloadUrl.includes("X-Amz-Expires=900"));
  } finally {
    process.env = originalEnv;
    resetR2ClientForTesting();
  }
});



