import { AppointmentStatus } from "@prisma/client";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { sendConfirmedBookingMessage } from "@/lib/line-notifications";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const appointmentId = parseSingleBigInt(id, "appointmentId");

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: {
          include: {
            lineUser: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (appointment.status !== AppointmentStatus.pending) {
      return NextResponse.json(
        { error: "Only pending appointment can be confirmed" },
        { status: 409 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.confirmed,
        confirmedAt: new Date()
      },
      select: {
        id: true,
        bookingNo: true,
        status: true,
        confirmedAt: true
      }
    });

    if (appointment.customer.lineUser?.isFollowing) {
      await sendConfirmedBookingMessage(prisma, {
        lineUserDbId: appointment.customer.lineUser.id,
        linePlatformUserId: appointment.customer.lineUser.lineUserId,
        bookingNo: appointment.bookingNo,
        entryToken: appointment.customer.lineUser.homeEntryToken,
        lang: "zh"
      });
    }

    return NextResponse.json({
      id: updated.id.toString(),
      bookingNo: updated.bookingNo,
      status: updated.status,
      confirmedAt: updated.confirmedAt?.toISOString() ?? null
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to confirm appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
