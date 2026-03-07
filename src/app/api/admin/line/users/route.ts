import { LineMessageDirection } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getLineConfig } from "@/lib/line";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const keyword = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const items = await prisma.lineUser.findMany({
      where: keyword
        ? {
            OR: [
              { lineUserId: { contains: keyword } },
              { displayName: { contains: keyword, mode: "insensitive" } },
              { customer: { is: { name: { contains: keyword, mode: "insensitive" } } } },
              { customer: { is: { email: { contains: keyword, mode: "insensitive" } } } }
            ]
          }
        : undefined,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            text: true,
            messageType: true,
            direction: true,
            createdAt: true,
            readAt: true
          }
        }
      },
      orderBy: [{ lastSeenAt: "desc" }, { updatedAt: "desc" }],
      take: 80
    });

    const unreadCounts = items.length
      ? await prisma.lineMessage.groupBy({
          by: ["lineUserId"],
          where: {
            lineUserId: { in: items.map((item) => item.id) },
            direction: LineMessageDirection.incoming,
            readAt: null
          },
          _count: { _all: true }
        })
      : [];

    const unreadByLineUserId = new Map(
      unreadCounts.map((item) => [item.lineUserId.toString(), item._count._all])
    );

    const config = getLineConfig();

    return NextResponse.json({
      config: {
        enabled: config.enabled,
        appBaseUrlConfigured: Boolean(config.appBaseUrl)
      },
      items: items.map((item) => ({
        id: item.id.toString(),
        lineUserId: item.lineUserId,
        displayName: item.displayName,
        pictureUrl: item.pictureUrl,
        isFollowing: item.isFollowing,
        linkedAt: item.linkedAt?.toISOString() ?? null,
        lastSeenAt: item.lastSeenAt?.toISOString() ?? null,
        unreadCount: unreadByLineUserId.get(item.id.toString()) ?? 0,
        customer: item.customer
          ? {
              id: item.customer.id.toString(),
              name: item.customer.name,
              email: item.customer.email
            }
          : null,
        lastMessage: item.messages[0]
          ? {
              text: item.messages[0].text,
              messageType: item.messages[0].messageType,
              direction: item.messages[0].direction,
              createdAt: item.messages[0].createdAt.toISOString(),
              readAt: item.messages[0].readAt?.toISOString() ?? null
            }
          : null
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch LINE users",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
