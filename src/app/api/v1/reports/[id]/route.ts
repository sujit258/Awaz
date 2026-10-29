import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportStatusUpdateSchema, ReportDeletionSchema } from "@/lib/validation/schemas";
import { verifyAccessKey } from "@/lib/auth/access-key";
import { toOwnerReportDTO } from "@/lib/dto/report";

// Helper to authorize request via Session User OR Anonymous Access Key
async function isAuthorizedForReport(
  req: NextRequest,
  report: {
    id: string;
    userId: string | null;
    accessKeyHash: string | null;
  }
): Promise<{ authorized: boolean; isStaff: boolean; actorId: string | null }> {
  // 1. Check logged-in user
  const user = await getCurrentUser();
  if (user) {
    if (user.role === "ADMIN" || user.role === "MODERATOR") {
      return { authorized: true, isStaff: true, actorId: user.id };
    }
    if (report.userId && report.userId === user.id) {
      return { authorized: true, isStaff: false, actorId: user.id };
    }
  }

  // 2. Check anonymous access key from header or query param
  const providedKey = req.headers.get("x-awaz-access-key") || req.nextUrl.searchParams.get("accessKey");
  if (providedKey && report.accessKeyHash) {
    const isValid = verifyAccessKey(providedKey, report.accessKeyHash);
    if (isValid) {
      return { authorized: true, isStaff: false, actorId: null };
    }
  }

  return { authorized: false, isStaff: false, actorId: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    if (!report || report.isDeleted) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const auth = await isAuthorizedForReport(req, report);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Access denied. Valid authentication or access key required." }, { status: 403 });
    }

    return NextResponse.json({
      report: toOwnerReportDTO(report),
    });
  } catch (error) {
    console.error("Fetch report error:", error);
    return NextResponse.json({ error: "Failed to fetch report." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id },
    });

    if (!report || report.isDeleted) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    const auth = await isAuthorizedForReport(req, report);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: "Access denied. Only the reporting consumer or authorized staff can update status." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ReportStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update fields.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { orderStatus, complaintStatus, resolutionOutcome, hasMeaningfulUpdate } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (complaintStatus) updateData.complaintStatus = complaintStatus;
    if (resolutionOutcome !== undefined) updateData.resolutionOutcome = resolutionOutcome;
    if (hasMeaningfulUpdate !== undefined) updateData.hasMeaningfulUpdate = hasMeaningfulUpdate;

    const updated = await prisma.complaintReport.update({
      where: { id },
      data: updateData,
      include: {
        issue: { select: { slug: true, title: true, companyId: true } },
        evidence: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.actorId,
        action: "CUSTOMER_UPDATE_STATUS",
        targetType: "REPORT",
        targetId: report.id,
        metadata: JSON.stringify({
          updatedFields: Object.keys(updateData),
          isAnonymousUpdate: auth.actorId === null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      report: toOwnerReportDTO(updated),
    });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Failed to update report status." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.complaintReport.findUnique({
      where: { id },
    });

    if (!report || report.isDeleted) {
      return NextResponse.json({ error: "Report not found or already deleted." }, { status: 404 });
    }

    const auth = await isAuthorizedForReport(req, report);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: "Access denied. Only the reporting consumer can request deletion." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = ReportDeletionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Deletion confirmation required.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Dependency-aware purge of associated private evidence files to honor data retention
    await prisma.evidence.deleteMany({
      where: { complaintReportId: report.id },
    });

    // Soft-delete complaint report and scrub personal identifiers
    const deletedReport = await prisma.complaintReport.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        contactEmail: null,
        contactPhone: null,
        orderReference: null,
        description: "[Report withdrawn by user]",
        summary: "[Withdrawn]",
      },
    });

    // Audit log for deletion compliance
    await prisma.auditLog.create({
      data: {
        actorId: auth.actorId,
        action: "CUSTOMER_DELETE_REPORT",
        targetType: "REPORT",
        targetId: deletedReport.id,
        metadata: JSON.stringify({
          referenceNumber: report.referenceNumber,
          reason: parsed.data.reason || "User requested deletion",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Report successfully withdrawn and private evidence removed in compliance with data protection policies.",
    });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Failed to delete report." }, { status: 500 });
  }
}
