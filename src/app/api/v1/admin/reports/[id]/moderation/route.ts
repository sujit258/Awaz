import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminModerationActionSchema } from "@/lib/validation/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id: reportId } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = AdminModerationActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid moderation action data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { action, reason, newIssueId } = parsed.data;

    if (action === "RECLASSIFY" && newIssueId) {
      await prisma.complaintReport.update({
        where: { id: reportId },
        data: { issueId: newIssueId },
      });
    } else if (action === "FLAG_DUPLICATE") {
      await prisma.complaintReport.update({
        where: { id: reportId },
        data: { complaintStatus: "DISPUTED" },
      });
    } else if (action === "REJECT") {
      await prisma.complaintReport.update({
        where: { id: reportId },
        data: { verificationStatus: "REJECTED" },
      });
    }

    const moderationAction = await prisma.moderationAction.create({
      data: {
        targetType: "REPORT",
        targetId: reportId,
        action,
        reason,
        adminId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: `ADMIN_${action}`,
        targetType: "REPORT",
        targetId: reportId,
        metadata: JSON.stringify({ reason, newIssueId }),
      },
    });

    return NextResponse.json({
      success: true,
      moderationAction,
    });
  } catch (error) {
    console.error("Admin moderation action error:", error);
    return NextResponse.json(
      { error: "Failed to apply moderation action." },
      { status: 500 }
    );
  }
}
