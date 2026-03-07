import { LineMessageDirection, LineMessageStatus } from "@prisma/client";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { pushLineTextMessage } from "@/lib/line";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const sendSchema = z.object({
  text: z.string().trim().min(1).max(2000)
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const lineUserRecordId = parseSingleBigInt(params.id, "id");
    const payload = sendSchema.parse(await request.json());

    const lineUser = await prisma.lineUser.findUnique({ where: { id: lineUserRecordId } });
    if (!lineUser) {
      return NextResponse.json({ error: "LINE user not found" }, { status: 404 });
    }

    try {
      await pushLineTextMessage(lineUser.lineUserId, payload.text);
      const message = await prisma.lineMessage.create({
        data: {
          lineUserId: lineUser.id,
          direction: LineMessageDirection.outgoing,
          status: LineMessageStatus.sent,
          messageType: "text",
          text: payload.text
        }
      });

      return NextResponse.json({
        message: {
          id: message.id.toString(),
          direction: message.direction,
          status: message.status,
          messageType: message.messageType,
          text: message.text,
          createdAt: message.createdAt.toISOString()
        }
      });
    } catch (lineError) {
      const message = await prisma.lineMessage.create({
        data: {
          lineUserId: lineUser.id,
          direction: LineMessageDirection.outgoing,
          status: LineMessageStatus.failed,
          messageType: "text",
          text: payload.text,
          rawJson: {
            error: lineError instanceof Error ? lineError.message : "Unknown LINE error"
          }
        }
      });

      return NextResponse.json(
        {
          error: "Failed to send LINE message",
          details: lineError instanceof Error ? lineError.message : "Unknown LINE error",
          message: {
            id: message.id.toString(),
            direction: message.direction,
            status: message.status,
            messageType: message.messageType,
            text: message.text,
            createdAt: message.createdAt.toISOString()
          }
        },
        { status: 502 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to send LINE message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
