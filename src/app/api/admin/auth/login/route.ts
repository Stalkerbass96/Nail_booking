import { createAdminSessionToken, setAdminSessionCookie, verifyPassword } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(200)
});

export async function POST(request: NextRequest) {
  try {
    const payload = loginSchema.parse(await request.json());
    const email = payload.email.toLowerCase();

    const admin = await prisma.admin.findFirst({
      where: { email },
      select: { id: true, email: true, displayName: true, passwordHash: true }
    });

    if (!admin || !verifyPassword(payload.password, admin.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = createAdminSessionToken(admin);
    const response = NextResponse.json({
      ok: true,
      admin: {
        id: admin.id.toString(),
        email: admin.email,
        displayName: admin.displayName
      }
    });

    setAdminSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to login",
        details: error instanceof Error ? error.message : "Unknown"
      },
      { status: 500 }
    );
  }
}