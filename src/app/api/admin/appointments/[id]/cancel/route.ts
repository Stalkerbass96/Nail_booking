import { AppointmentStatus } from "@prisma/client";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional()
});

const DEFAULT_CANCEL_CUTOFF_HOURS = 6;

async function getCancelCutoffHours(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "cancel_cutoff_hours" },
    select: { value: true }
  });

  const parsed = Number.parseInt(setting?.value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_CANCEL_CUTOFF_HOURS;
  return parsed;
}

function isWithinCancelCutoff(startAt: Date, cutoffHours: number): boolean {
  if (cutoffHours <= 0) return false;
  const cutoffAt = startAt.getTime() - cutoffHours * 60 * 60 * 1000;
  return Date.now() >= cutoffAt;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const appointmentId = parseSingleBigInt(id, "appointmentId");

    const bodyText = await request.text();
    const payload = bodyText ? cancelSchema.parse(JSON.parse(bodyText)) : { reason: undefined };

    const [appointment, cancelCutoffHours] = await Promise.all([
      prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, status: true, startAt: true }
      }),
      getCancelCutoffHours()
    ]);

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    if (
      appointment.status !== AppointmentStatus.pending &&
      appointment.status !== AppointmentStatus.confirmed
    ) {
      return NextResponse.json(
        { error: "Only pending/confirmed appointment can be canceled" },
        { status: 409 }
      );
    }

    if (isWithinCancelCutoff(appointment.startAt, cancelCutoffHours)) {
      return NextResponse.json(
        {
          error: `Cannot cancel within ${cancelCutoffHours} hours before start time`
        },
        { status: 409 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.canceled,
        cancelReason: payload.reason ?? "Canceled by admin"
      },
      select: {
        id: true,
        bookingNo: true,
        status: true,
        cancelReason: true
      }
    });

    return NextResponse.json({
      id: updated.id.toString(),
      bookingNo: updated.bookingNo,
      status: updated.status,
      cancelReason: updated.cancelReason
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

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

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to cancel appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}