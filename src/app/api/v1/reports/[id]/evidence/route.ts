import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { EvidenceUploadSchema } from "@/lib/validation/schemas";
import { randomUUID } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (report.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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

    const fileExt = fileName.split(".").pop() || "bin";
    const storageKey = `evidence/${report.id}/${randomUUID()}.${fileExt}`;

    const evidence = await prisma.evidence.create({
      data: {
        complaintReportId: report.id,
        storageKey,
        fileName,
        fileType,
        fileSize,
        reviewStatus: "PENDING_REVIEW",
        redactionStatus: redactionConfirmed ? "REDACTED_BY_USER" : "NOT_REDACTED",
        retentionDeadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days retention
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
        actorId: user.id,
        action: "UPLOAD_EVIDENCE",
        targetType: "EVIDENCE",
        targetId: evidence.id,
        metadata: JSON.stringify({ fileName, fileSize, reportId: report.id }),
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
