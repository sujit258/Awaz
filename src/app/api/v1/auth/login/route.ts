import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { LoginSchema } from "@/lib/validation/schemas";
import { comparePassword, createSessionToken, COOKIE_NAME } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/antispam/rate-limit";
import { getTrustedClientIp } from "@/lib/antispam/ip";

export async function POST(req: NextRequest) {
  try {
    const ip = getTrustedClientIp(req);
    const rateCheck = checkRateLimit(`login:${ip}`, 10, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials format.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: "This account has been suspended or deactivated." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_LOGIN",
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in." },
      { status: 500 }
    );
  }
}
