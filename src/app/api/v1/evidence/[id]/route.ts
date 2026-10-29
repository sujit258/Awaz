import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyAccessKey } from "@/lib/auth/access-key";
import { getR2Config, createPresignedDownloadUrl } from "@/lib/storage/r2";

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

    const r2Config = getR2Config();
    const wantsDownload = req.nextUrl.searchParams.get("download") === "true";

    if (!r2Config.isConfigured) {
      if (wantsDownload) {
        return NextResponse.json(
          { error: "Evidence download unavailable: private object storage is not configured." },
          { status: 503 }
        );
      }

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
        storageConfigured: false,
        downloadAvailable: false,
      });
    }

    // Generate short-lived (15 minutes) authorized download URL with forced attachment disposition
    const downloadUrl = await createPresignedDownloadUrl(evidence.storageKey, evidence.fileName, 900);

    if (wantsDownload) {
      return NextResponse.redirect(downloadUrl, 307);
    }

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
      storageConfigured: true,
      downloadAvailable: true,
      downloadUrl,
    });
  } catch (error) {
    console.error("Evidence fetch error:", error);
    return NextResponse.json(
      { error: "Failed to access evidence." },
      { status: 500 }
    );
  }
}
