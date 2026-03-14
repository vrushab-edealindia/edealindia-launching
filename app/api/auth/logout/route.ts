import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth";

const COOKIE_NAME = "edeal_admin_session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", clearSessionCookieOptions() as Parameters<NextResponse["cookies"]["set"]>[2]);
  return res;
}
