import { NextResponse } from "next/server";
import { COOKIE_NAME, credentialsValid, createSession, checkOrigin, apiError } from "@/lib/auth";
const attempts = new Map();
export async function POST(request) {
  try {
    checkOrigin(request);
    const { email, password, remember } = await request.json();
    if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 256) return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
    const key = email.trim().toLowerCase();
    const now = Date.now();
    for (const [k,v] of attempts) if (v.until < now) attempts.delete(k);
    const limit = attempts.get(key) ?? { count: 0, until: now + 15 * 60 * 1000 };
    if (limit.count >= 8) return NextResponse.json({ error: "Too many attempts. Please try again in 15 minutes." }, { status: 429 });
    if (!credentialsValid(key, password)) {
      attempts.set(key, { ...limit, count: limit.count + 1 });
      return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
    }
    attempts.delete(key);
    const session = createSession(key, Boolean(remember));
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, session.token, { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/", ...(remember ? { maxAge: session.maxAge } : {}) });
    return response;
  } catch (error) { return apiError(error); }
}
export async function DELETE(request) {
  try {
    checkOrigin(request);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch (error) { return apiError(error); }
}
