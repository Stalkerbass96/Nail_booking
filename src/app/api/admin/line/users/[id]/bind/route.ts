import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bindSchema = z.object({
  customerId: z.string().trim().min(1).nullable()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const lineUserRecordId = parseSingleBigInt(params.id, "id");
    const payload = bindSchema.parse(await request.json());

    if (payload.customerId === null) {
      const updated = await prisma.lineUser.update({
        where: { id: lineUserRecordId },
        data: { customerId: null }
      });

      return NextResponse.json({
        user: {
          id: updated.id.toString(),
          customer: null
        }
      });
    }

    const customerId = parseSingleBigInt(payload.customerId, "customerId");

    const user = await prisma.$transaction(async (tx) => {
      await tx.lineUser.updateMany({
        where: { customerId },
        data: { customerId: null }
      });

      return tx.lineUser.update({
        where: { id: lineUserRecordId },
        data: {
          customerId,
          linkedAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      user: {
        id: user.id.toString(),
        customer: user.customer
          ? {
              id: user.customer.id.toString(),
              name: user.customer.name,
              email: user.customer.email
            }
          : null
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to bind LINE user",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
