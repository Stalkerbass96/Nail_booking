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

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        appointments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            bookingNo: true,
            status: true,
            startAt: true,
            endAt: true,
            actualPaidJpy: true,
            createdAt: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: customer.id.toString(),
      name: customer.name,
      email: customer.email,
      notes: customer.notes,
      totalSpentJpy: customer.totalSpentJpy,
      currentPoints: customer.currentPoints,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      appointments: customer.appointments.map((appt) => ({
        id: appt.id.toString(),
        bookingNo: appt.bookingNo,
        status: appt.status,
        startAt: appt.startAt.toISOString(),
        endAt: appt.endAt.toISOString(),
        actualPaidJpy: appt.actualPaidJpy,
        createdAt: appt.createdAt.toISOString()
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to fetch customer detail", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}