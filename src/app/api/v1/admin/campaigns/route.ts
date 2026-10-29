import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { z } from "zod";

const CampaignSchema = z.object({
  issueId: z.string().min(1),
  title: z.string().min(5).max(120),
  objective: z.string().min(20).max(1000),
  requestedAction: z.string().min(20).max(1500),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "CONCLUDED"]).default("ACTIVE"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { issueId, title, objective, requestedAction, status } = parsed.data;

    const campaign = await prisma.actionCampaign.create({
      data: {
        issueId,
        title,
        objective,
        requestedAction,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "CREATE_CAMPAIGN",
        targetType: "CAMPAIGN",
        targetId: campaign.id,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("Admin campaign create error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign." },
      { status: 500 }
    );
  }
}
