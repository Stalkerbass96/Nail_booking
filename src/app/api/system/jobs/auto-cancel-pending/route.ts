import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const incoming = request.headers.get("x-cron-secret");
      if (incoming !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const result = await prisma.appointment.updateMany({
      where: {
        status: AppointmentStatus.pending,
        autoCancelAt: { lte: now }
      },
      data: {
        status: AppointmentStatus.canceled,
        cancelReason: "Auto-canceled: pending timeout"
      }
    });

    return NextResponse.json({
      canceledCount: result.count,
      executedAt: now.toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to auto-cancel pending appointments",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
