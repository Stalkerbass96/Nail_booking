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
        lineUser: {
          select: {
            id: true,
            lineUserId: true,
            displayName: true,
            isFollowing: true,
            linkedAt: true,
            lastSeenAt: true,
            createdAt: true
          }
        },
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
            sourceChannel: true,
            createdAt: true,
            showcaseItem: {
              select: {
                id: true,
                titleZh: true,
                titleJa: true
              }
            },
            servicePackage: {
              select: {
                id: true,
                nameZh: true,
                nameJa: true
              }
            }
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
      customerType: customer.customerType,
      createdFrom: customer.createdFrom,
      firstBookedAt: customer.firstBookedAt?.toISOString() ?? null,
      totalSpentJpy: customer.totalSpentJpy,
      currentPoints: customer.currentPoints,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      lineUser: customer.lineUser
        ? {
            id: customer.lineUser.id.toString(),
            lineUserId: customer.lineUser.lineUserId,
            displayName: customer.lineUser.displayName,
            isFollowing: customer.lineUser.isFollowing,
            linkedAt: customer.lineUser.linkedAt?.toISOString() ?? null,
            lastSeenAt: customer.lineUser.lastSeenAt?.toISOString() ?? null,
            createdAt: customer.lineUser.createdAt.toISOString()
          }
        : null,
      appointments: customer.appointments.map((appt) => ({
        id: appt.id.toString(),
        bookingNo: appt.bookingNo,
        status: appt.status,
        startAt: appt.startAt.toISOString(),
        endAt: appt.endAt.toISOString(),
        actualPaidJpy: appt.actualPaidJpy,
        sourceChannel: appt.sourceChannel,
        package: {
          id: appt.servicePackage.id.toString(),
          nameZh: appt.servicePackage.nameZh,
          nameJa: appt.servicePackage.nameJa
        },
        showcaseItem: appt.showcaseItem
          ? {
              id: appt.showcaseItem.id.toString(),
              titleZh: appt.showcaseItem.titleZh,
              titleJa: appt.showcaseItem.titleJa
            }
          : null,
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
