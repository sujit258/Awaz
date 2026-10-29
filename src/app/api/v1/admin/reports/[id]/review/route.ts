import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ModerationReviewSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Access denied. Moderator privileges required." }, { status: 403 });
    }

    const { id } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id },
      include: { evidence: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = ModerationReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { verificationStatus, reviewNote, evidenceId, evidenceStatus } = parsed.data;

    // 1. Update report verification status
    const updatedReport = await prisma.complaintReport.update({
      where: { id },
      data: {
        verificationStatus,
      },
    });

    // 2. If evidence was specifically reviewed
    if (evidenceId && evidenceStatus) {
      await prisma.evidence.update({
        where: { id: evidenceId },
        data: {
          reviewStatus: evidenceStatus,
          reviewerId: user.id,
          reviewNote: reviewNote || null,
        },
      });
    }

    // 3. Record moderation action audit trail
    await prisma.moderationAction.create({
      data: {
        targetType: "REPORT",
        targetId: report.id,
        action: verificationStatus === "VERIFIED" ? "VERIFY" : "REJECT",
        reason: reviewNote || `Status updated to ${verificationStatus} by moderator ${user.displayName || user.email}`,
        adminId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "MODERATOR_REVIEW_REPORT",
        targetType: "REPORT",
        targetId: report.id,
        metadata: JSON.stringify({
          fromStatus: report.verificationStatus,
          toStatus: verificationStatus,
          evidenceId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
      message: `Report verification status set to ${verificationStatus}`,
    });
  } catch (error) {
    console.error("Moderation review error:", error);
    return NextResponse.json(
      { error: "Failed to record moderation review." },
      { status: 500 }
    );
  }
}
