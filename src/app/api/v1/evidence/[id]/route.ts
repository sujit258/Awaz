import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyAccessKey } from "@/lib/auth/access-key";
import { getStorageConfig } from "@/lib/storage/evidence-purge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const evidence = await prisma.evidence.findUnique({
      where: { id },
      include: {
        complaintReport: {
          select: {
            id: true,
            userId: true,
            accessKeyHash: true,
            referenceNumber: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!evidence || evidence.complaintReport.isDeleted) {
      return NextResponse.json({ error: "Evidence record not found." }, { status: 404 });
    }

    // Check authorization: User Session OR Report Access Key
    const user = await getCurrentUser();
    let isAuthorized = false;

    if (user) {
      const isOwner = evidence.complaintReport.userId === user.id;
      const isStaff = user.role === "ADMIN" || user.role === "MODERATOR";
      if (isOwner || isStaff) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      // Header-only transport: NEVER accept access keys in query parameters
      const providedKey = req.headers.get("x-awaz-access-key")?.trim();
      if (providedKey && evidence.complaintReport.accessKeyHash) {
        if (verifyAccessKey(providedKey, evidence.complaintReport.accessKeyHash)) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Access denied to private evidence." }, { status: 403 });
    }

    const storageConfig = getStorageConfig();

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
      storageConfigured: storageConfig.isConfigured,
      downloadAvailable: storageConfig.isConfigured,
    });
  } catch (error) {
    console.error("Evidence fetch error:", error);
    return NextResponse.json(
      { error: "Failed to access evidence." },
      { status: 500 }
    );
  }
}
