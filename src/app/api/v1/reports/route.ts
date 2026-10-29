import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ComplaintSubmissionSchema } from "@/lib/validation/schemas";
import { checkRateLimit } from "@/lib/antispam/rate-limit";
import { detectPotentialDuplicate } from "@/lib/antispam/duplicates";
import { generateAccessKey, hashAccessKey } from "@/lib/auth/access-key";
import { getTrustedClientIp } from "@/lib/antispam/ip";

// Generate unique, readable reference code e.g. "AWZ-2026-X89J"
function generateReferenceNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `AWZ-${year}-${randomPart}`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const clientIp = getTrustedClientIp(req);

    // Rate limiting: 5 reports per 10 minutes
    const rateLimitKey = user ? `report:user:${user.id}` : `report:ip:${clientIp}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 600_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Submission rate limit reached. Please wait before submitting additional reports." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ComplaintSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid submission data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check idempotency key if provided
    if (data.idempotencyKey) {
      const existing = await prisma.complaintReport.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        include: { issue: { select: { slug: true, title: true } } },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          isRetry: true,
          report: {
            id: existing.id,
            referenceNumber: existing.referenceNumber,
            verificationStatus: existing.verificationStatus,
            issueSlug: existing.issue.slug,
          },
        });
      }
    }

    // Verify issue category exists
    const issue = await prisma.issue.findUnique({
      where: { id: data.issueId },
    });
    if (!issue) {
      return NextResponse.json({ error: "Specified issue category not found." }, { status: 404 });
    }

    // Generate safe summary if not provided (max 140 chars)
    const effectiveSummary = data.summary && data.summary.trim().length > 0
      ? data.summary.trim()
      : data.description.substring(0, 120).trim();

    // Check duplicate similarity for authenticated users
    if (user) {
      const duplicateCheck = await detectPotentialDuplicate(
        user.id,
        data.issueId,
        effectiveSummary,
        data.description
      );

      if (duplicateCheck.isDuplicateBySameUser && duplicateCheck.suspectedDuplicateOfReportId) {
        const existingReport = await prisma.complaintReport.findUnique({
          where: { id: duplicateCheck.suspectedDuplicateOfReportId },
        });
        if (existingReport) {
          return NextResponse.json({
            success: true,
            isDuplicate: true,
            message: "A very similar report was recently submitted by your account.",
            report: {
              id: existingReport.id,
              referenceNumber: existingReport.referenceNumber,
              verificationStatus: existingReport.verificationStatus,
              issueSlug: issue.slug,
            },
          });
        }
      }
    }

    // Generate unique reference number with retry for safety
    let referenceNumber = generateReferenceNumber();
    let collision = await prisma.complaintReport.findUnique({ where: { referenceNumber } });
    while (collision) {
      referenceNumber = generateReferenceNumber();
      collision = await prisma.complaintReport.findUnique({ where: { referenceNumber } });
    }

    // Generate cryptographic access key for anonymous or offline tracking
    const accessKey = generateAccessKey();
    const accessKeyHash = hashAccessKey(accessKey);

    const orderDate = data.orderDate ? new Date(data.orderDate) : null;
    const promisedDeliveryDate = data.promisedDeliveryDate ? new Date(data.promisedDeliveryDate) : null;

    // Create report record
    const newReport = await prisma.complaintReport.create({
      data: {
        referenceNumber,
        userId: user ? user.id : null,
        accessKeyHash,
        issueId: issue.id,
        orderDate,
        promisedDeliveryDate,
        orderStatus: data.orderStatus || "AWAITING_DELIVERY",
        complaintStatus: "OPEN",
        verificationStatus: "UNVERIFIED",
        summary: effectiveSummary,
        description: data.description,
        resolutionOutcome: data.resolutionOutcome || null,
        approximateRegion: data.approximateRegion || null,
        orderReference: data.orderReference || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        hasMeaningfulUpdate: data.hasMeaningfulUpdate || false,
        idempotencyKey: data.idempotencyKey || null,
        isDemo: process.env.DEMO_MODE === "true",
      },
    });

    // Audit log (never log access key or full private description)
    await prisma.auditLog.create({
      data: {
        actorId: user ? user.id : null,
        action: user ? "CREATE_REPORT" : "CREATE_ANONYMOUS_REPORT",
        targetType: "REPORT",
        targetId: newReport.id,
        metadata: JSON.stringify({
          referenceNumber: newReport.referenceNumber,
          issueSlug: issue.slug,
          isAnonymous: !user,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      report: {
        id: newReport.id,
        referenceNumber: newReport.referenceNumber,
        verificationStatus: newReport.verificationStatus,
        complaintStatus: newReport.complaintStatus,
        orderStatus: newReport.orderStatus,
        issueSlug: issue.slug,
        issueTitle: issue.title,
        createdAt: newReport.createdAt,
        isAnonymous: !user,
      },
      // Returned ONLY once upon creation so anonymous user can securely store it
      accessKey,
    });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving your report." },
      { status: 500 }
    );
  }
}
