import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const customerIdRaw = request.nextUrl.searchParams.get("customerId");
    const limitRaw = request.nextUrl.searchParams.get("limit") ?? "200";
    const limit = Math.min(Math.max(Number.parseInt(limitRaw, 10) || 200, 1), 500);

    const customerId = customerIdRaw ? parseSingleBigInt(customerIdRaw, "customerId") : undefined;

    const items = await prisma.pointLedger.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        customer: {
          id: item.customer.id.toString(),
          name: item.customer.name,
          email: item.customer.email
        },
        appointmentId: item.appointmentId?.toString() ?? null,
        type: item.type,
        points: item.points,
        jpyValue: item.jpyValue,
        note: item.note,
        createdAt: item.createdAt.toISOString()
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to fetch points ledger", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}