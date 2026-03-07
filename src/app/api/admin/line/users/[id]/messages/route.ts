import { LineMessageDirection } from "@prisma/client";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseSingleBigInt(params.id, "id");

    const lineUser = await prisma.$transaction(async (tx) => {
      await tx.lineMessage.updateMany({
        where: {
          lineUserId: id,
          direction: LineMessageDirection.incoming,
          readAt: null
        },
        data: { readAt: new Date() }
      });

      return tx.lineUser.findUnique({
        where: { id },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          messages: {
            orderBy: { createdAt: "asc" },
            take: 200,
            include: {
              sentByAdmin: {
                select: {
                  displayName: true
                }
              }
            }
          }
        }
      });
    });

    if (!lineUser) {
      return NextResponse.json({ error: "LINE user not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: lineUser.id.toString(),
        lineUserId: lineUser.lineUserId,
        displayName: lineUser.displayName,
        pictureUrl: lineUser.pictureUrl,
        isFollowing: lineUser.isFollowing,
        customer: lineUser.customer
          ? {
              id: lineUser.customer.id.toString(),
              name: lineUser.customer.name,
              email: lineUser.customer.email
            }
          : null
      },
      messages: lineUser.messages.map((item) => ({
        id: item.id.toString(),
        direction: item.direction,
        status: item.status,
        messageType: item.messageType,
        text: item.text,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt?.toISOString() ?? null,
        sentByAdminName: item.sentByAdmin?.displayName ?? null
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch LINE messages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
