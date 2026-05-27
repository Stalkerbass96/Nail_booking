import { prisma } from "@/lib/db";
import { LINE_MSG_DEFAULTS, LINE_MSG_KEYS, parseMsgSettings } from "@/lib/line-message-settings";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const msgString = z.string().trim().max(1000);

const updateSchema = z.object({
  line_msg_welcome_1: msgString.optional(),
  line_msg_welcome_2: msgString.optional(),
  line_msg_gallery_1: msgString.optional(),
  line_msg_gallery_2: msgString.optional(),
  line_msg_pending: msgString.optional(),
  line_msg_confirmed: msgString.optional(),
  line_msg_rescheduled: msgString.optional()
});

async function readMessages() {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [...LINE_MSG_KEYS] } },
    select: { key: true, value: true }
  });
  return parseMsgSettings(rows);
}

export async function GET() {
  try {
    const messages = await readMessages();
    return NextResponse.json({ messages, defaults: LINE_MSG_DEFAULTS });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch LINE message settings", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = updateSchema.parse(await request.json());

    const updates: Array<{ key: string; value: string }> = [];
    for (const key of LINE_MSG_KEYS) {
      const raw = payload[key];
      if (raw !== undefined) {
        // Fall back to default if blank so the field never becomes empty
        const value = raw.trim() || LINE_MSG_DEFAULTS[key];
        updates.push({ key, value });
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((item) =>
          prisma.systemSetting.upsert({
            where: { key: item.key },
            create: item,
            update: { value: item.value }
          })
        )
      );
    }

    const messages = await readMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update LINE message settings", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
