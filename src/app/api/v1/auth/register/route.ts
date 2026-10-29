import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { RegisterSchema } from "@/lib/validation/schemas";
import { hashPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/antispam/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, displayName } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        displayName: displayName || email.split("@")[0],
        role: "CITIZEN",
        verifiedAt: new Date(),
      },
    });

    // Create session token
    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_REGISTER",
        targetType: "USER",
        targetId: user.id,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error occurred during registration." },
      { status: 500 }
    );
  }
}
