import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE = "quiniela_session";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long.");
  }
  return secret;
}

function base64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const payload = base64url(JSON.stringify({ ...user, iat: Date.now() }));
  return `${payload}.${sign(payload)}`;
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isAdmin: Boolean(decoded.isAdmin),
    };
  } catch {
    return null;
  }
}
