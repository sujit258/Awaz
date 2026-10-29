import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export const COOKIE_NAME = "awaz_auth_token";
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "awaz-default-secret-do-not-use-in-production-min-32-chars"
);

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  role: "CITIZEN" | "MODERATOR" | "ADMIN";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email as string,
      displayName: (payload.displayName as string) || null,
      role: payload.role as "CITIZEN" | "MODERATOR" | "ADMIN",
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}
