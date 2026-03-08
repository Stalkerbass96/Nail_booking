import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const keyword = (request.nextUrl.searchParams.get("q") ?? "").trim();
    const limitRaw = request.nextUrl.searchParams.get("limit") ?? "100";
    const limit = Math.min(Math.max(Number.parseInt(limitRaw, 10) || 100, 1), 300);

    const items = await prisma.customer.findMany({
      where: keyword
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
        : undefined,
      include: {
        lineUser: {
          select: {
            lineUserId: true,
            displayName: true,
            isFollowing: true,
            lastSeenAt: true
          }
        },
        appointments: {
          select: { id: true }
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
        appointmentCount: item.appointments.length,
        lineUser: item.lineUser
          ? {
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
