import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const keyword = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const filter = (request.nextUrl.searchParams.get("filter") ?? "").trim();
    const limitRaw = request.nextUrl.searchParams.get("limit") ?? "100";
    const limit = Math.min(Math.max(Number.parseInt(limitRaw, 10) || 100, 1), 300);

    const lineFollowersWhere = filter === "line_followers"
      ? { lineUser: { is: { isFollowing: true } } }
      : undefined;

    const items = await prisma.customer.findMany({
      where: lineFollowersWhere ?? (keyword
        ? {
            OR: [
              { name: { contains: keyword, mode: "insensitive" } },
              { email: { contains: keyword, mode: "insensitive" } },
              {
                lineUser: {
                  is: {
                    OR: [
                      { displayName: { contains: keyword, mode: "insensitive" } },
                      { lineUserId: { contains: keyword, mode: "insensitive" } }
                    ]
                  }
                }
              }
            ]
          }
        : undefined),
      include: {
        lineUser: {
          select: {
            id: true,
            lineUserId: true,
            displayName: true,
            isFollowing: true,
            lastSeenAt: true
          }
        },
        _count: {
          select: {
            appointments: true,
            pointLedgers: true
          }
        }
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        email: item.email,
        notes: item.notes,
        customerType: item.customerType,
        createdFrom: item.createdFrom,
        firstBookedAt: item.firstBookedAt?.toISOString() ?? null,
        totalSpentJpy: item.totalSpentJpy,
        currentPoints: item.currentPoints,
        appointmentCount: item._count.appointments,
        pointLedgerCount: item._count.pointLedgers,
        deletable: item._count.appointments === 0 && item._count.pointLedgers === 0,
        lineUser: item.lineUser
          ? {
              id: item.lineUser.id.toString(),
              lineUserId: item.lineUser.lineUserId,
              displayName: item.lineUser.displayName,
              isFollowing: item.lineUser.isFollowing,
              lastSeenAt: item.lineUser.lastSeenAt?.toISOString() ?? null
            }
          : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch customers", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const mode = (request.nextUrl.searchParams.get("mode") ?? "").trim();
    if (mode !== "cleanup-leads") {
      return NextResponse.json({ error: "Invalid cleanup mode" }, { status: 400 });
    }

    const candidates = await prisma.customer.findMany({
      where: {
        customerType: "lead",
        appointments: { none: {} },
        pointLedgers: { none: {} }
      },
      select: {
        id: true,
        lineUser: {
          select: { id: true }
        }
      }
    });

    if (candidates.length === 0) {
      return NextResponse.json({ deletedCount: 0 });
    }

    const customerIds = candidates.map((item) => item.id);
    const lineUserIds = candidates
      .map((item) => item.lineUser?.id)
      .filter((value): value is bigint => value !== undefined && value !== null);

    await prisma.$transaction(async (tx) => {
      if (lineUserIds.length > 0) {
        await tx.lineUser.deleteMany({
          where: {
            id: { in: lineUserIds }
          }
        });
      }

      await tx.customer.deleteMany({
        where: {
          id: { in: customerIds }
        }
      });
    });

    return NextResponse.json({ deletedCount: candidates.length });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cleanup lead customers", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
