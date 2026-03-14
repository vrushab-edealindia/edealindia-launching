import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, sessionCookieHeader, isAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ADMIN_EMAIL?.trim() || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin login not configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local" },
        { status: 503 }
      );
    }
    if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 16) {
      return NextResponse.json(
        { error: "Auth not configured. Set AUTH_SECRET (min 16 chars) in .env.local" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (!isAdmin(email, password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createSessionToken(email);
    const cookie = sessionCookieHeader(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<NextResponse["cookies"]["set"]>[2]);
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
