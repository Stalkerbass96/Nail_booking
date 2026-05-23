import { AppointmentStatus } from "@prisma/client";
import {
  buildDateTimeWithOffset,
  formatYmdInOffset
} from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { dateToUtcMidnight, getOpenSlotsForDate, slotsToWindows } from "@/lib/day-slots";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from") ?? "";
    const to = request.nextUrl.searchParams.get("to") ?? "";

    if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
      return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    const rangeStart = buildDateTimeWithOffset(from, "00:00");
    const rangeEnd = buildDateTimeWithOffset(to, "23:59");

    // Build list of all 7 day YMDs in JST for the requested range
    const dayYmds: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(rangeStart.getTime() + i * 24 * 60 * 60 * 1000);
      dayYmds.push(formatYmdInOffset(d));
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        startAt: { gte: rangeStart, lte: rangeEnd },
        status: {
          in: [
            AppointmentStatus.pending,
            AppointmentStatus.confirmed,
            AppointmentStatus.completed
          ]
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
    });

    // Fetch open windows per day from DaySlot
    const dayWindowEntries = await Promise.all(
      dayYmds.map(async (ymd) => {
        const slots = await getOpenSlotsForDate(prisma, ymd);
        const windows = slotsToWindows(ymd, slots);
        return { ymd, windows };
      })
    );

    // Build businessWindows map (first + last window per day for calendar background shading)
    const businessWindows: Record<
      string,
      { isOpen: boolean; openAt: string | null; closeAt: string | null; openSlots: number[] }
    > = {};
    for (const { ymd, windows } of dayWindowEntries) {
      const openSlots = await getOpenSlotsForDate(prisma, ymd);
      if (windows.length === 0) {
        businessWindows[ymd] = { isOpen: false, openAt: null, closeAt: null, openSlots: [] };
      } else {
        businessWindows[ymd] = {
          isOpen: true,
          openAt: windows[0].openAt.toISOString(),
          closeAt: windows[windows.length - 1].closeAt.toISOString(),
          openSlots
        };
      }
    }

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
      bookingBlocks: [],
      businessWindows
    });
  } catch (err) {
    console.error("[/api/admin/calendar] error:", err);
    return NextResponse.json(
      { error: "Internal error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
