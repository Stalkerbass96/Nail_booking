import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { ensureLineCustomerByLineUserId } from "@/lib/line-customers";
import { buildLineHomeUrl, getLineConfig } from "@/lib/line";
import { sendGalleryHomeLink } from "@/lib/line-notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  lang: z.enum(["zh", "ja"]).optional()
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const lineUserRecordId = parseSingleBigInt(params.id, "id");
    const payload = bodySchema.parse(await request.json().catch(() => ({})));
    const lang = payload.lang ?? "zh";
    const config = getLineConfig();

    if (!config.enabled) {
      return NextResponse.json({ error: "LINE is not configured" }, { status: 503 });
    }

    if (!config.appBaseUrl) {
      return NextResponse.json({ error: "APP_BASE_URL is not configured" }, { status: 503 });
    }

    const lineUser = await ensureLineCustomerByLineUserId(lineUserRecordId);
    if (!lineUser) {
      return NextResponse.json({ error: "LINE user not found" }, { status: 404 });
    }

    if (!lineUser.homeEntryToken) {
      return NextResponse.json({ error: "Failed to prepare gallery entry token" }, { status: 500 });
    }

    const sent = await sendGalleryHomeLink(prisma, {
      lineUserDbId: lineUser.id,
      linePlatformUserId: lineUser.lineUserId,
      entryToken: lineUser.homeEntryToken,
      lang
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send gallery booking link" }, { status: 502 });
    }

    await prisma.lineUser.update({
      where: { id: lineUser.id },
      data: {
        lastHomeLinkSentAt: new Date()
      }
    });

    return NextResponse.json({
      ok: true,
      galleryUrl: buildLineHomeUrl(lineUser.homeEntryToken, lang),
      lineUser: {
        id: lineUser.id.toString(),
        customerId: lineUser.customerId?.toString() ?? null,
        homeEntryToken: lineUser.homeEntryToken
      }
    });
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
        error: "Failed to send gallery booking link",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
