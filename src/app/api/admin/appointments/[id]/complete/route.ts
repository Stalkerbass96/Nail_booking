import { AppointmentStatus, PointTxType } from "@prisma/client";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { calculateEarnedPoints, calculateRedeemJpy } from "@/lib/points";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const completeSchema = z.object({
  actualPaidJpy: z.number().int().min(0),
  usePoints: z.number().int().min(0).optional().default(0),
  note: z.string().trim().max(500).optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const appointmentId = parseSingleBigInt(id, "appointmentId");
    const payload = completeSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          customer: {
            select: {
              id: true,
              currentPoints: true
            }
          }
        }
      });

      if (!appointment) {
        return { type: "error", status: 404, message: "Appointment not found" } as const;
      }

      if (appointment.status !== AppointmentStatus.confirmed) {
        return {
          type: "error",
          status: 409,
          message: "Only confirmed appointment can be completed"
        } as const;
      }

      if (payload.usePoints > appointment.customer.currentPoints) {
        return {
          type: "error",
          status: 400,
          message: "Insufficient customer points"
        } as const;
      }

      const earnedPoints = calculateEarnedPoints(payload.actualPaidJpy);
      const redeemJpy = calculateRedeemJpy(payload.usePoints);

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.completed,
          completedAt: new Date(),
          actualPaidJpy: payload.actualPaidJpy
        }
      });

      await tx.customer.update({
        where: { id: appointment.customer.id },
        data: {
          totalSpentJpy: { increment: payload.actualPaidJpy },
          currentPoints: { increment: earnedPoints - payload.usePoints }
        }
      });

      if (payload.usePoints > 0) {
        await tx.pointLedger.create({
          data: {
            customerId: appointment.customer.id,
            appointmentId: appointment.id,
            type: PointTxType.use,
            points: payload.usePoints,
            jpyValue: redeemJpy,
            note: payload.note ?? "Point deduction on appointment completion"
          }
        });
      }

      if (earnedPoints > 0) {
        await tx.pointLedger.create({
          data: {
            customerId: appointment.customer.id,
            appointmentId: appointment.id,
            type: PointTxType.earn,
            points: earnedPoints,
            jpyValue: payload.actualPaidJpy,
            note: "Points earned from completed appointment"
          }
        });
      }

      const updatedCustomer = await tx.customer.findUnique({
        where: { id: appointment.customer.id },
        select: { currentPoints: true }
      });

      return {
        type: "ok",
        bookingNo: appointment.bookingNo,
        earnedPoints,
        usedPoints: payload.usePoints,
        currentPoints: updatedCustomer?.currentPoints ?? 0,
        actualPaidJpy: payload.actualPaidJpy
      } as const;
    });

    if (result.type === "error") {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json({
      bookingNo: result.bookingNo,
      status: AppointmentStatus.completed,
      actualPaidJpy: result.actualPaidJpy,
      earnedPoints: result.earnedPoints,
      usedPoints: result.usedPoints,
      currentPoints: result.currentPoints
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

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to complete appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}