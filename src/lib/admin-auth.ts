export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export type AdminRole = "owner" | "staff";

export interface SessionPayload {
  email: string;
  role: AdminRole;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set. Add it to .env.local.");
  }
  return secret;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function hmac(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toBase64Url(signature);
}

// Email is base64url-encoded inside the token so a literal "." in the address (very
// common, e.g. first.last@domain.com) can't be confused with the token's own field
// separator when splitting it back apart.
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const emailB64 = toBase64Url(new TextEncoder().encode(payload.email));
  const data = `${expiry}.${emailB64}.${payload.role}`;
  const signature = await hmac(data);
  return `${data}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [expiryStr, emailB64, role, signature] = parts;

  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry < Math.floor(Date.now() / 1000)) return null;
  if (role !== "owner" && role !== "staff") return null;

  const data = `${expiryStr}.${emailB64}.${role}`;
  const expected = await hmac(data);
  if (expected.length !== signature.length) return null;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return null;

  try {
    return { email: fromBase64Url(emailB64), role };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;

/** Reads and verifies the admin session cookie off a request — for routes that need
 *  to know who's acting (audit logging) beyond the proxy's pass/fail gate. */
export async function getSessionFromRequest(req: {
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<SessionPayload | null> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
