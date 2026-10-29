import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to participate in collective action." },
        { status: 401 }
      );
    }

    const { id: campaignId } = await params;

    const campaign = await prisma.actionCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This campaign is no longer accepting new participants." },
        { status: 400 }
      );
    }

    // Upsert or re-activate participation
    const participation = await prisma.campaignParticipation.upsert({
      where: {
        campaignId_userId: {
          campaignId,
          userId: user.id,
        },
      },
      update: {
        withdrawnAt: null,
      },
      create: {
        campaignId,
        userId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "JOIN_CAMPAIGN",
        targetType: "CAMPAIGN",
        targetId: campaignId,
      },
    });

    const participantCount = await prisma.campaignParticipation.count({
      where: { campaignId, withdrawnAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined campaign",
      participation: {
        id: participation.id,
        joinedAt: participation.joinedAt,
      },
      participantCount,
    });
  } catch (error) {
    console.error("Join campaign error:", error);
    return NextResponse.json(
      { error: "Failed to join campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;

    const existing = await prisma.campaignParticipation.findUnique({
      where: {
        campaignId_userId: {
          campaignId,
          userId: user.id,
        },
      },
    });

    if (!existing || existing.withdrawnAt !== null) {
      return NextResponse.json(
        { error: "You are not an active participant in this campaign." },
        { status: 400 }
      );
    }

    await prisma.campaignParticipation.update({
      where: {
        campaignId_userId: {
          campaignId,
          userId: user.id,
        },
      },
      data: {
        withdrawnAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "WITHDRAW_CAMPAIGN",
        targetType: "CAMPAIGN",
        targetId: campaignId,
      },
    });

    const participantCount = await prisma.campaignParticipation.count({
      where: { campaignId, withdrawnAt: null },
    });

    return NextResponse.json({
      success: true,
      message: "Participation withdrawn successfully",
      participantCount,
    });
  } catch (error) {
    console.error("Withdraw campaign error:", error);
    return NextResponse.json(
      { error: "Failed to withdraw participation" },
      { status: 500 }
    );
  }
}
