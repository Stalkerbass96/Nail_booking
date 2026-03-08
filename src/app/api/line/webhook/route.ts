import { LineMessageDirection, LineMessageStatus } from "@prisma/client";
import { ensureLineCustomer } from "@/lib/line-customers";
import { prisma } from "@/lib/db";
import { sendWelcomeHomeLink } from "@/lib/line-notifications";
import { getLineConfig, getLineProfile, replyLineTextMessage, verifyLineSignature } from "@/lib/line";
import { NextRequest, NextResponse } from "next/server";

async function upsertLineUser(userId: string) {
  const profile = await getLineProfile(userId);

  return prisma.lineUser.upsert({
    where: { lineUserId: userId },
    create: {
      lineUserId: userId,
      displayName: profile?.displayName,
      pictureUrl: profile?.pictureUrl,
      statusMessage: profile?.statusMessage,
      isFollowing: true,
      lastSeenAt: new Date()
    },
    update: {
      displayName: profile?.displayName,
      pictureUrl: profile?.pictureUrl,
      statusMessage: profile?.statusMessage,
      isFollowing: true,
      lastSeenAt: new Date()
    },
    select: {
      id: true,
      lineUserId: true,
      customerId: true,
      displayName: true,
      homeEntryToken: true,
      welcomeSentAt: true
    }
  });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature") ?? "";
  const config = getLineConfig();

  if (!config.channelSecret) {
    return NextResponse.json({ error: "LINE channel secret is not configured" }, { status: 503 });
  }

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as { events?: Array<Record<string, any>> };
    const events = payload.events ?? [];

    for (const event of events) {
      const source = event.source;
      if (!source || source.type !== "user" || typeof source.userId !== "string") {
        continue;
      }

      const user = await upsertLineUser(source.userId);

      if (event.type === "unfollow") {
        await prisma.lineUser.update({
          where: { id: user.id },
          data: { isFollowing: false, lastSeenAt: new Date() }
        });
        continue;
      }

      if (event.type === "follow") {
        const ensured = await prisma.$transaction(async (tx) => {
          await tx.lineMessage.create({
            data: {
              lineUserId: user.id,
              direction: LineMessageDirection.system,
              status: LineMessageStatus.received,
              messageType: "follow",
              text: "User followed the LINE official account",
              readAt: new Date(),
              rawJson: event
            }
          });

          return ensureLineCustomer(tx, user);
        });

        if (!ensured.welcomeSentAt && ensured.homeEntryToken && config.enabled && config.appBaseUrl) {
          const sent = await sendWelcomeHomeLink(prisma, {
            lineUserDbId: ensured.id,
            linePlatformUserId: ensured.lineUserId,
            entryToken: ensured.homeEntryToken
          });

          if (sent) {
            await prisma.lineUser.update({
              where: { id: ensured.id },
              data: {
                welcomeSentAt: new Date(),
                lastHomeLinkSentAt: new Date()
              }
            });
          }
        }

        continue;
      }

      if (event.type === "accountLink") {
        const nonce = typeof event.link?.nonce === "string" ? event.link.nonce : "";
        const result = typeof event.link?.result === "string" ? event.link.result : "";

        if (nonce && result === "ok") {
          const token = await prisma.lineLinkToken.findFirst({
            where: {
              token: nonce,
              consumedAt: null,
              expiresAt: { gt: new Date() }
            }
          });

          if (token) {
            await prisma.$transaction(async (tx) => {
              await tx.lineUser.updateMany({
                where: { customerId: token.customerId },
                data: { customerId: null }
              });
              await tx.lineUser.update({
                where: { id: user.id },
                data: { customerId: token.customerId, linkedAt: new Date() }
              });
              await tx.lineLinkToken.update({
                where: { id: token.id },
                data: { consumedAt: new Date() }
              });
            });
          }
        }

        await prisma.lineMessage.create({
          data: {
            lineUserId: user.id,
            direction: LineMessageDirection.system,
            status: LineMessageStatus.received,
            messageType: "accountLink",
            text: `Account link event: ${result || "unknown"}`,
            readAt: new Date(),
            rawJson: event
          }
        });
        continue;
      }

      if (event.type === "message") {
        const messageType = typeof event.message?.type === "string" ? event.message.type : "unknown";
        const text = messageType === "text" && typeof event.message?.text === "string" ? event.message.text : null;

        await prisma.lineMessage.create({
          data: {
            lineUserId: user.id,
            direction: LineMessageDirection.incoming,
            status: LineMessageStatus.received,
            messageType,
            text,
            rawJson: event
          }
        });

        if (typeof event.replyToken === "string" && config.enabled && config.autoReplyText) {
          try {
            await replyLineTextMessage(event.replyToken, config.autoReplyText);
          } catch {
            // Best effort only.
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process LINE webhook",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
