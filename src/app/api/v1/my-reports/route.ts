import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.complaintReport.findMany({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("My reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch your reports." },
      { status: 500 }
    );
  }
}
