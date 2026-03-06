import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const customerId = parseSingleBigInt(id, "customerId");

    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const items = await prisma.pointLedger.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        appointmentId: true,
        type: true,
        points: true,
        jpyValue: true,
        note: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
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
      { error: "Failed to fetch customer points", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}