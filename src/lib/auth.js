import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHmac, randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { isDemo } from "./storage.js";
export const COOKIE_NAME = "bytefx_session";
function secret() {
  if (process.env.SESSION_SECRET?.length >= 32) return process.env.SESSION_SECRET;
  if (!isDemo()) throw new Error("Set SESSION_SECRET to at least 32 characters.");
  if (!globalThis.bytefxDemoSecret) {
    const directory = path.join(process.cwd(), ".data");
    const filename = path.join(directory, "demo-session-secret");
    mkdirSync(directory, { recursive: true });
    try { globalThis.bytefxDemoSecret = readFileSync(filename, "utf8"); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      try { writeFileSync(filename, randomBytes(32).toString("hex"), { flag: "wx", mode: 0o600 }); }
      catch (writeError) { if (writeError.code !== "EEXIST") throw writeError; }
      globalThis.bytefxDemoSecret = readFileSync(filename, "utf8");
    }
  }
  return globalThis.bytefxDemoSecret;
}
const equal = (a,b) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
export function credentialsValid(email, password) {
  if (isDemo()) return equal(email.toLowerCase(), "name@bytefx.com") && equal(password, "ByteFX2026!");
  const [salt, stored] = (process.env.ACCOUNTANT_PASSWORD_HASH ?? "").split(":");
  if (!salt || !stored || !process.env.ACCOUNTANT_EMAIL) throw new Error("Accountant credentials are not configured.");
  return equal(email.toLowerCase(), process.env.ACCOUNTANT_EMAIL.toLowerCase()) && equal(scryptSync(password, salt, 64).toString("hex"), stored);
}
export function createSession(email, remember) {
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8;
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + maxAge * 1000 })).toString("base64url");
  return { token: payload + "." + createHmac("sha256", secret()).update(payload).digest("base64url"), maxAge };
}
export async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const [payload, signature, extra] = token.split(".");
    if (extra || !signature || !equal(signature, createHmac("sha256", secret()).update(payload).digest("base64url"))) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data : null;
  } catch { return null; }
}
export async function requireApiSession() {
  if (!await getSession()) throw Object.assign(new Error("Your session has expired. Please sign in again."), { status: 401 });
}
export function checkOrigin(request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const expectedOrigin = process.env.APP_URL || url.protocol + "//" + (request.headers.get("host") || url.host);
  if (origin && origin !== expectedOrigin) throw Object.assign(new Error("Request origin is not allowed."), { status: 403 });
}
export function apiError(error) {
  const status = error.status ?? 500;
  if (status === 500) console.error(error);
  return Response.json({ error: status === 500 ? "Unable to complete the request. Please try again." : error.message, errors: error.errors }, { status });
}
