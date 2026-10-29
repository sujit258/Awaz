import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

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

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: {
        complaintReport: {
          select: {
            id: true,
            userId: true,
            referenceNumber: true,
          },
        },
      },
    });

    if (!evidence) {
      return NextResponse.json({ error: "Evidence record not found" }, { status: 404 });
    }

    // Authorization: owner or staff only
    const isOwner = evidence.complaintReport.userId === user.id;
    const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: "Access denied to private evidence" }, { status: 403 });
    }

    // Return authenticated evidence metadata with secure view token/details
    return NextResponse.json({
      id: evidence.id,
      fileName: evidence.fileName,
      fileType: evidence.fileType,
      fileSize: evidence.fileSize,
      reviewStatus: evidence.reviewStatus,
      redactionStatus: evidence.redactionStatus,
      reviewNote: evidence.reviewNote,
      reportReference: evidence.complaintReport.referenceNumber,
      uploadedAt: evidence.createdAt,
      // In production with S3/Neon Object storage, this returns an authenticated short-lived signed URL
      accessUrl: `/api/v1/evidence/${evidence.id}/stream`,
    });
  } catch (error) {
    console.error("Evidence fetch error:", error);
    return NextResponse.json(
      { error: "Failed to access evidence" },
      { status: 500 }
    );
  }
}
