import { AppointmentStatus } from "@prisma/client";
import {
  buildDateTimeWithOffset,
  formatYmdInOffset
} from "@/lib/booking-rules";
import { getBusinessWindowByDate } from "@/lib/business-hours";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function addDaysToDate(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const rangeStart = buildDateTimeWithOffset(from, "00:00");
  const rangeEnd = buildDateTimeWithOffset(to, "23:59");

  // Build list of all 7 day YMDs in the range
  const dayYmds: string[] = [];
  for (let i = 0; i < 7; i++) {
    dayYmds.push(formatYmdInOffset(addDaysToDate(rangeStart, i)));
  }

  const [appointments, bookingBlocks, ...windowResults] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        startAt: { gte: rangeStart, lte: rangeEnd },
        status: {
          in: [AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.completed]
        }
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        bookingNo: true,
        startAt: true,
        endAt: true,
        status: true,
        customer: { select: { name: true } },
        servicePackage: { select: { nameZh: true, nameJa: true } }
      }
    }),
    prisma.bookingBlock.findMany({
      where: {
        startAt: { lte: rangeEnd },
        endAt: { gte: rangeStart }
      },
      orderBy: { startAt: "asc" },
      select: { id: true, startAt: true, endAt: true, reason: true }
    }),
    ...dayYmds.map((ymd) => getBusinessWindowByDate(prisma, ymd))
  ]);

  const businessWindows: Record<string, { isOpen: boolean; openAt?: string; closeAt?: string }> = {};
  dayYmds.forEach((ymd, i) => {
    const w = windowResults[i];
    businessWindows[ymd] = {
      isOpen: w.isOpen,
      openAt: w.openAt?.toISOString(),
      closeAt: w.closeAt?.toISOString()
    };
  });

  return NextResponse.json({
    appointments: appointments.map((row) => ({
      id: row.id.toString(),
      bookingNo: row.bookingNo,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      status: row.status,
      customerName: row.customer.name,
      packageNameZh: row.servicePackage.nameZh,
      packageNameJa: row.servicePackage.nameJa
    })),
    bookingBlocks: bookingBlocks.map((b) => ({
      id: b.id.toString(),
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      reason: b.reason ?? null
    })),
    businessWindows
  });
}
