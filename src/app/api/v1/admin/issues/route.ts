import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const IssueSchema = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric and hyphens."),
  companyId: z.string().default("flipkart"),
  category: z.string().min(2),
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(1000),
  publicationStatus: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("PUBLISHED"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = IssueSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { slug, companyId, category, title, description, publicationStatus } = parsed.data;

    const issue = await prisma.issue.upsert({
      where: { slug },
      update: {
        title,
        description,
        category,
        publicationStatus,
      },
      create: {
        slug,
        companyId,
        category,
        title,
        description,
        publicationStatus,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE_OR_UPDATE_ISSUE",
        targetType: "ISSUE",
        targetId: issue.id,
        metadata: JSON.stringify({ slug, title }),
      },
    });

    return NextResponse.json({ success: true, issue });
  } catch (error) {
    console.error("Admin issue create error:", error);
    return NextResponse.json(
      { error: "Failed to create or update issue." },
      { status: 500 }
    );
  }
}
