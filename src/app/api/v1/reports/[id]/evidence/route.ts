import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { EvidenceUploadSchema } from "@/lib/validation/schemas";
import { verifyAccessKey } from "@/lib/auth/access-key";
import {
  getR2Config,
  validateEvidenceFile,
  generateEvidenceStorageKey,
  createPresignedUploadUrl,
  uploadBufferToR2,
} from "@/lib/storage/r2";

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
      const providedKey = req.headers.get("x-awaz-access-key")?.trim();
      if (providedKey && report.accessKeyHash) {
        if (verifyAccessKey(providedKey, report.accessKeyHash)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Access denied. Valid login or report access key required." }, { status: 403 });
    }

    // Safety guard: Ensure private Cloudflare R2 storage is configured before accepting uploads
    const r2Config = getR2Config();
    if (!r2Config.isConfigured) {
      return NextResponse.json(
        {
          error: "Evidence uploads are currently paused because private object storage is not configured for this environment. Reports remain eligible without evidence.",
          storageConfigured: false,
        },
        { status: 503 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    // 1. Support direct multipart/form-data upload (fallback or automated pipelines)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const redactionConfirmed = formData.get("redactionConfirmed") === "true";

      if (!file) {
        return NextResponse.json({ error: "No file was provided in upload." }, { status: 400 });
      }

      const validation = validateEvidenceFile(file.name, file.type, file.size);
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || "Invalid evidence file." }, { status: 400 });
      }

      const cleanExt = validation.cleanExt || "bin";
      const storageKey = generateEvidenceStorageKey(report.id, cleanExt);
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      const uploadResult = await uploadBufferToR2(storageKey, fileBytes, file.type);
      if (!uploadResult.success) {
        return NextResponse.json(
          { error: "Failed to persist evidence object to Cloudflare R2." },
          { status: 502 }
        );
      }

      const safeFileName = file.name.replace(/[^\w\s.-]/gi, "_");
      const evidence = await prisma.evidence.create({
        data: {
          complaintReportId: report.id,
          storageKey,
          fileName: safeFileName,
          fileType: file.type,
          fileSize: file.size,
          reviewStatus: "PENDING_REVIEW",
          redactionStatus: redactionConfirmed ? "REDACTED_BY_USER" : "NOT_REDACTED",
          retentionDeadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      });

      if (report.verificationStatus === "UNVERIFIED") {
        await prisma.complaintReport.update({
          where: { id: report.id },
          data: { verificationStatus: "EVIDENCE_SUBMITTED" },
        });
      }

      await prisma.auditLog.create({
        data: {
          actorId,
          action: "UPLOAD_EVIDENCE",
          targetType: "EVIDENCE",
          targetId: evidence.id,
          metadata: JSON.stringify({
            fileName: evidence.fileName,
            fileSize: evidence.fileSize,
            reportId: report.id,
            isAnonymous: actorId === null,
            directUpload: true,
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
    }

    // 2. Default: Presigned Upload URL generation for secure, direct-to-R2 upload
    const body = await req.json();
    const parsed = EvidenceUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid evidence metadata.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fileName, fileType, fileSize, redactionConfirmed } = parsed.data;

    const validation = validateEvidenceFile(fileName, fileType, fileSize);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error || "Invalid evidence file." }, { status: 400 });
    }

    const cleanExt = validation.cleanExt || "bin";
    const storageKey = generateEvidenceStorageKey(report.id, cleanExt);
    const safeFileName = fileName.replace(/[^\w\s.-]/gi, "_");

    // Generate short-lived presigned PUT URL (5 minutes)
    const uploadUrl = await createPresignedUploadUrl(storageKey, fileType, fileSize, 300);

    const evidence = await prisma.evidence.create({
      data: {
        complaintReportId: report.id,
        storageKey,
        fileName: safeFileName,
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
          presignedUpload: true,
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
      uploadUrl,
    });
  } catch (error) {
    console.error("Evidence upload error:", error);
    return NextResponse.json(
      { error: "Failed to attach evidence record." },
      { status: 500 }
    );
  }
}
