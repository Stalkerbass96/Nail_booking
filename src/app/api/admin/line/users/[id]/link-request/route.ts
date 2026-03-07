import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import {
  createLineLinkToken,
  getLineConfig,
  issueLineLinkToken,
  pushLineTextMessage
} from "@/lib/line";
import { NextRequest, NextResponse } from "next/server";

const LINK_SESSION_TTL_MS = 30 * 60 * 1000;

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseSingleBigInt(params.id, "id");
    const config = getLineConfig();

    if (!config.enabled) {
      return NextResponse.json({ error: "LINE is not configured" }, { status: 503 });
    }

    if (!config.appBaseUrl) {
      return NextResponse.json({ error: "APP_BASE_URL is not configured" }, { status: 503 });
    }

    const lineUser = await prisma.lineUser.findUnique({
      where: { id },
      select: {
        id: true,
        lineUserId: true,
        displayName: true
      }
    });

    if (!lineUser) {
      return NextResponse.json({ error: "LINE user not found" }, { status: 404 });
    }

    const lineLinkToken = await issueLineLinkToken(lineUser.lineUserId);
    const sessionToken = createLineLinkToken();
    const expiresAt = new Date(Date.now() + LINK_SESSION_TTL_MS);

    const session = await prisma.lineLinkSession.create({
      data: {
        sessionToken,
        lineUserId: lineUser.id,
        lineLinkToken,
        expiresAt
      }
    });

    const linkUrl = `${config.appBaseUrl}/line/link?session=${encodeURIComponent(sessionToken)}`;
    const manageUrl = `${config.appBaseUrl}/line/manage`;
    const message = [
      "美甲预约系统 LINE 绑定链接",
      "请打开下面的链接，完成本次预约与 LINE 账号绑定：",
      linkUrl,
      "",
      "绑定完成后，你可以在 LINE 中接收店铺通知，",
      "也可以继续通过 LINE 与店长进行 1 对 1 沟通。",
      "绑定管理页面：",
      manageUrl
    ].join("\n");

    try {
      await pushLineTextMessage(lineUser.lineUserId, message);
    } catch (error) {
      await prisma.lineLinkSession.delete({ where: { id: session.id } });
      throw error;
    }

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id.toString(),
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt.toISOString()
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to send LINE link request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
