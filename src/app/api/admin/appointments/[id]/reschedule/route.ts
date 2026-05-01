import { AppointmentStatus } from "@prisma/client";
import { findOverlappingBookingBlock } from "@/lib/booking-blocks";
import {
  addMinutes,
  formatDateTimeInOffset,
  formatYmdInOffset,
  isAlignedToSlot,
  parseSingleBigInt,
  DEFAULT_SLOT_MINUTES
} from "@/lib/booking-rules";
import { getBusinessWindowByDate } from "@/lib/business-hours";
import { prisma } from "@/lib/db";
import { sendRescheduledBookingMessage } from "@/lib/line-notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const rescheduleSchema = z.object({
  newStartAt: z.string().datetime({ offset: true })
});

async function getSlotMinutes(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "slot_minutes" },
    select: { value: true }
  });
  const parsed = Number.parseInt(setting?.value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SLOT_MINUTES;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const appointmentId = parseSingleBigInt(id, "appointmentId");

    const body = await request.json();
    const { newStartAt: newStartAtRaw } = rescheduleSchema.parse(body);

    const [appointment, slotMinutes] = await Promise.all([
      prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          servicePackage: { select: { durationMin: true } },
          addons: { select: { durationSnapshotMin: true } },
          customer: {
            include: {
              lineUser: {
                select: {
                  id: true,
                  lineUserId: true,
                  isFollowing: true,
                  homeEntryToken: true
                }
              }
            }
          }
        }
      }),
      getSlotMinutes()
    ]);

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (
      appointment.status !== AppointmentStatus.pending &&
      appointment.status !== AppointmentStatus.confirmed
    ) {
      return NextResponse.json(
        { error: "Only pending/confirmed appointments can be rescheduled" },
        { status: 409 }
      );
    }

    const newStartAt = new Date(newStartAtRaw);

    if (newStartAt <= new Date()) {
      return NextResponse.json({ error: "New start time must be in the future" }, { status: 400 });
    }

    if (!isAlignedToSlot(newStartAt, slotMinutes)) {
      return NextResponse.json(
        { error: `New start time must align to ${slotMinutes}-minute slots` },
        { status: 400 }
      );
    }

    const totalDurationMinutes =
      appointment.servicePackage.durationMin +
      appointment.addons.reduce((sum, a) => sum + a.durationSnapshotMin, 0);

    const newEndAt = addMinutes(newStartAt, totalDurationMinutes);
    const bookingYmd = formatYmdInOffset(newStartAt);

    const businessWindow = await getBusinessWindowByDate(prisma, bookingYmd);
    if (!businessWindow.isOpen || !businessWindow.openAt || !businessWindow.closeAt) {
      return NextResponse.json({ error: "Store is closed on the selected date" }, { status: 400 });
    }
    if (newStartAt < businessWindow.openAt || newEndAt > businessWindow.closeAt) {
      return NextResponse.json({ error: "Selected time is outside business hours" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingYmd}))`;

      const [conflict, blocked] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            id: { not: appointmentId },
            status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
            startAt: { lt: newEndAt },
            endAt: { gt: newStartAt }
          },
          select: { id: true }
        }),
        findOverlappingBookingBlock(tx, newStartAt, newEndAt)
      ]);

      if (conflict) {
        throw Object.assign(new Error("Selected time slot is no longer available"), { status: 409 });
      }
      if (blocked) {
        throw Object.assign(
          new Error(blocked.reason || "Selected time is blocked by the store owner"),
          { status: 409 }
        );
      }

      return tx.appointment.update({
        where: { id: appointmentId },
        data: { startAt: newStartAt, endAt: newEndAt },
        select: {
          id: true,
          bookingNo: true,
          status: true,
          startAt: true,
          endAt: true
        }
      });
    });

    const lineUser = appointment.customer.lineUser;
    if (lineUser?.isFollowing) {
      await sendRescheduledBookingMessage(prisma, {
        lineUserDbId: lineUser.id,
        linePlatformUserId: lineUser.lineUserId,
        bookingNo: updated.bookingNo,
        newStartAt: updated.startAt,
        entryToken: lineUser.homeEntryToken,
        lang: "ja"
      });
    }

    return NextResponse.json({
      id: updated.id.toString(),
      bookingNo: updated.bookingNo,
      status: updated.status,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      newTimeFormatted: formatDateTimeInOffset(updated.startAt, "ja-JP")
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && "status" in error) {
      return NextResponse.json({ error: error.message }, { status: (error as Error & { status: number }).status });
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to reschedule appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
