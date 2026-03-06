import { PointTxType } from "@prisma/client";
import { calculateRedeemJpy } from "@/lib/points";
import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const usePointsSchema = z.object({
  customerId: z.union([z.string(), z.number().int().positive()]),
  appointmentId: z.union([z.string(), z.number().int().positive()]).optional(),
  points: z.number().int().positive(),
  note: z.string().trim().max(500).optional()
});

export async function POST(request: NextRequest) {
  try {
    const payload = usePointsSchema.parse(await request.json());

    const customerId = parseSingleBigInt(String(payload.customerId), "customerId");
    const appointmentId =
      payload.appointmentId === undefined
        ? null
        : parseSingleBigInt(String(payload.appointmentId), "appointmentId");

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { id: true, currentPoints: true }
      });

      if (!customer) {
        return { type: "error", status: 404, message: "Customer not found" } as const;
      }

      if (payload.points > customer.currentPoints) {
        return { type: "error", status: 400, message: "Insufficient customer points" } as const;
      }

      if (appointmentId !== null) {
        const appointment = await tx.appointment.findUnique({
          where: { id: appointmentId },
          select: { id: true, customerId: true }
        });

        if (!appointment) {
          return { type: "error", status: 404, message: "Appointment not found" } as const;
        }

        if (appointment.customerId !== customer.id) {
          return {
            type: "error",
            status: 400,
            message: "Appointment does not belong to the customer"
          } as const;
        }
      }

      await tx.customer.update({
        where: { id: customer.id },
        data: {
          currentPoints: { decrement: payload.points }
        }
      });

      await tx.pointLedger.create({
        data: {
          customerId: customer.id,
          appointmentId,
          type: PointTxType.use,
          points: payload.points,
          jpyValue: calculateRedeemJpy(payload.points),
          note: payload.note ?? "Manual points deduction"
        }
      });

      const updated = await tx.customer.findUnique({
        where: { id: customer.id },
        select: { currentPoints: true }
      });

      return {
        type: "ok",
        customerId: customer.id.toString(),
        usedPoints: payload.points,
        currentPoints: updated?.currentPoints ?? 0
      } as const;
    });

    if (result.type === "error") {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json(result, { status: 201 });
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
        error: "Failed to deduct points",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
