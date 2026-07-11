import { prisma } from "@/lib/db";
import {
  OWNER_LINE_USER_SETTING_KEY,
  getOwnerNotificationLineUserId,
  sendOwnerNotificationTest
} from "@/lib/owner-line-notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({ lineUserId: z.string().regex(/^\d+$/).nullable() });
const testSchema = z.object({ lineUserId: z.string().regex(/^\d+$/) });

export async function GET() {
  try {
    const [selectedId, users] = await Promise.all([
      getOwnerNotificationLineUserId(prisma),
      prisma.lineUser.findMany({
        where: { isFollowing: true },
        orderBy: [{ displayName: "asc" }, { id: "asc" }],
        select: { id: true, lineUserId: true, displayName: true, pictureUrl: true }
      })
    ]);
    return NextResponse.json({
      selectedLineUserId: selectedId?.toString() ?? null,
      users: users.map((user) => ({ ...user, id: user.id.toString() }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load owner notification settings", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = updateSchema.parse(await request.json());
    if (payload.lineUserId === null) {
      await prisma.systemSetting.deleteMany({ where: { key: OWNER_LINE_USER_SETTING_KEY } });
      return NextResponse.json({ selectedLineUserId: null });
    }
    const id = BigInt(payload.lineUserId);
    const user = await prisma.lineUser.findFirst({ where: { id, isFollowing: true }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "LINE user is not following the account" }, { status: 400 });
    await prisma.systemSetting.upsert({
      where: { key: OWNER_LINE_USER_SETTING_KEY },
      create: { key: OWNER_LINE_USER_SETTING_KEY, value: payload.lineUserId },
      update: { value: payload.lineUserId }
    });
    return NextResponse.json({ selectedLineUserId: payload.lineUserId });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    return NextResponse.json({ error: "Failed to save owner notification settings", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = testSchema.parse(await request.json());
    const sent = await sendOwnerNotificationTest(prisma, BigInt(payload.lineUserId));
    if (!sent) return NextResponse.json({ error: "Failed to send test notification" }, { status: 502 });
    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    return NextResponse.json({ error: "Failed to send test notification", details: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
