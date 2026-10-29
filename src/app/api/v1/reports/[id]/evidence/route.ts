import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { EvidenceUploadSchema } from "@/lib/validation/schemas";
import { verifyAccessKey } from "@/lib/auth/access-key";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id },
    });

    if (!report || report.isDeleted) {
      return NextResponse.json({ error: "Report not found or has been withdrawn." }, { status: 404 });
    }

    // Check authorization: User Session OR Anonymous Access Key
    const user = await getCurrentUser();
    let isAuthorized = false;
    let actorId: string | null = null;

    if (user) {
      if (user.role === "ADMIN" || report.userId === user.id) {
        isAuthorized = true;
        actorId = user.id;
      }
    }

    if (!isAuthorized) {
      const providedKey = req.headers.get("x-awaz-access-key") || req.nextUrl.searchParams.get("accessKey");
      if (providedKey && report.accessKeyHash) {
        if (verifyAccessKey(providedKey, report.accessKeyHash)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Access denied. Valid login or report access key required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = EvidenceUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid evidence metadata.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize, redactionConfirmed } = parsed.data;

    // Sanitize file extension - never trust raw user input
    const cleanExt = fileName.replace(/[^a-zA-Z0-9.]/g, "").split(".").pop() || "bin";
    const storageKey = `evidence/${report.id}/${randomUUID()}.${cleanExt}`;

    const evidence = await prisma.evidence.create({
      data: {
        complaintReportId: report.id,
        storageKey,
        fileName: fileName.replace(/[^\w\s.-]/gi, "_"),
        fileType,
        fileSize,
        reviewStatus: "PENDING_REVIEW",
        redactionStatus: redactionConfirmed ? "REDACTED_BY_USER" : "NOT_REDACTED",
        retentionDeadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days retention default
      },
    });

    // Update report verification status to EVIDENCE_SUBMITTED if currently UNVERIFIED
    if (report.verificationStatus === "UNVERIFIED") {
      await prisma.complaintReport.update({
        where: { id: report.id },
        data: { verificationStatus: "EVIDENCE_SUBMITTED" },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "UPLOAD_EVIDENCE",
        targetType: "EVIDENCE",
        targetId: evidence.id,
        metadata: JSON.stringify({
          fileName: evidence.fileName,
          fileSize,
          reportId: report.id,
          isAnonymous: actorId === null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      evidence: {
        id: evidence.id,
        fileName: evidence.fileName,
        fileType: evidence.fileType,
        fileSize: evidence.fileSize,
        reviewStatus: evidence.reviewStatus,
        redactionStatus: evidence.redactionStatus,
        createdAt: evidence.createdAt,
      },
    });
  } catch (error) {
    console.error("Evidence upload error:", error);
    return NextResponse.json(
      { error: "Failed to attach evidence record." },
      { status: 500 }
    );
  }
}
