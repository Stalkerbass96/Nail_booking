import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const ADMIN_SESSION_COOKIE = "nb_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  adminId: string;
  email: string;
  iat: number;
  exp: number;
};

type AdminIdentity = {
  id: bigint;
  email: string;
  displayName: string;
};

function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET is required");
  }

  return secret;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function hashPassword(password: string): string {
  return `sha256:${sha256Hex(password)}`;
}

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith("sha256:")) {
    const actual = hashPassword(password);
    return safeCompare(actual, storedHash);
  }

  // Legacy fallback for old seeded value.
  return safeCompare(password, storedHash);
}

function signPayload(payloadBase64: string): string {
  return createHmac("sha256", getAuthSecret()).update(payloadBase64).digest("base64url");
}

function encodePayload(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(payloadBase64: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    if (
      typeof parsed?.adminId !== "string" ||
      typeof parsed?.email !== "string" ||
      typeof parsed?.iat !== "number" ||
      typeof parsed?.exp !== "number"
    ) {
      return null;
    }

    return parsed as SessionPayload;
  } catch {
    return null;
  }
}

function buildToken(payload: SessionPayload): string {
  const payloadBase64 = encodePayload(payload);
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function verifyToken(token: string): SessionPayload | null {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64);
  if (!safeCompare(signature, expected)) return null;

  const payload = decodePayload(payloadBase64);
  if (!payload) return null;

  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function createAdminSessionToken(admin: { id: bigint; email: string }): string {
  const nowSec = Math.floor(Date.now() / 1000);
  return buildToken({
    adminId: admin.id.toString(),
    email: admin.email,
    iat: nowSec,
    exp: nowSec + ADMIN_SESSION_TTL_SECONDS
  });
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_TTL_SECONDS
  });
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0
  });
}

async function resolveAdminFromToken(token?: string | null): Promise<AdminIdentity | null> {
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const adminId = BigInt(payload.adminId);

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, email: true, displayName: true }
  });

  if (!admin) return null;
  if (!safeCompare(admin.email.toLowerCase(), payload.email.toLowerCase())) return null;

  return admin;
}

export async function getAdminFromRequest(request: NextRequest): Promise<AdminIdentity | null> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return resolveAdminFromToken(token);
}

export async function getAdminFromServerCookies(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return resolveAdminFromToken(token);
}