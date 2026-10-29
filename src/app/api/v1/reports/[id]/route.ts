import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportStatusUpdateSchema } from "@/lib/validation/schemas";

export async function GET(
  _req: NextRequest,
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
      include: {
        issue: {
          select: {
            id: true,
            slug: true,
            title: true,
            companyId: true,
            category: true,
          },
        },
        evidence: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            reviewStatus: true,
            redactionStatus: true,
            createdAt: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Authorization: owner or staff only
    const isOwner = report.userId === user.id;
    const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Fetch report error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

export async function PATCH(
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
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only report owner can update their personal status
    if (report.userId !== user.id) {
      return NextResponse.json(
        { error: "Only the reporting customer can update their status." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ReportStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update fields", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderStatus, complaintStatus, resolutionOutcome } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (complaintStatus) updateData.complaintStatus = complaintStatus;
    if (resolutionOutcome !== undefined) updateData.resolutionOutcome = resolutionOutcome;

    const updated = await prisma.complaintReport.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CUSTOMER_UPDATE_STATUS",
        targetType: "REPORT",
        targetId: report.id,
        metadata: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({
      success: true,
      report: updated,
    });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}
