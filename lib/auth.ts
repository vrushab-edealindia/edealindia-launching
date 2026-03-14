import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "edeal_admin_session";
const MAX_AGE = 60 * 60 * 24; // 24 hours
const SESSION_SECRET = process.env.AUTH_SECRET || process.env.SESSION_SECRET;

function getSecret(): string {
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    throw new Error("Set AUTH_SECRET (min 16 chars) in .env.local for admin session signing");
  }
  return SESSION_SECRET;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export interface SessionPayload {
  email: string;
  exp: number;
}

export function createSessionToken(email: string): string {
  const payload: SessionPayload = { email, exp: Date.now() + MAX_AGE * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;
    const expectedSig = sign(encoded);
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now() || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function sessionCookieHeader(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: MAX_AGE,
      path: "/",
    },
  };
}

export function clearSessionCookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}

export function isAdmin(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  return !!adminEmail && !!adminPassword && email === adminEmail && password === adminPassword;
}
