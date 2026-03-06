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
              { email: { contains: keyword, mode: "insensitive" } }
            ]
          }
        : undefined,
      include: {
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
        totalSpentJpy: item.totalSpentJpy,
        currentPoints: item.currentPoints,
        appointmentCount: item.appointments.length,
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