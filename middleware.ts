import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "nb_admin_session";

type SessionPayload = {
  adminId: string;
  email: string;
  iat: number;
  exp: number;
};

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function signPayload(payloadBase64: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadBase64));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parsePayload(payloadBase64: string): SessionPayload | null {
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payloadBase64));
    const parsed = JSON.parse(json);

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

async function verifySessionToken(token: string, secret: string): Promise<SessionPayload | null> {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = await signPayload(payloadBase64, secret);
  if (!safeStringEqual(signature, expected)) return null;

  const payload = parsePayload(payloadBase64);
  if (!payload) return null;

  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function isPublicAdminPath(pathname: string): boolean {
  if (pathname === "/admin/login") return true;
  if (pathname === "/api/admin/auth/login") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret) {
    if (pathname.startsWith("/api/admin/")) {
      return NextResponse.json(
        { error: "Server misconfigured: ADMIN_AUTH_SECRET is required" },
        { status: 503 }
      );
    }

    return new NextResponse("Server misconfigured: ADMIN_AUTH_SECRET is required", {
      status: 503
    });
  }

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token, secret) : null;

  if (payload) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/admin/login", request.url);
  const nextPath = `${pathname}${search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};