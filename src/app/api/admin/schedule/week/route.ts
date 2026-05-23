import { AppointmentStatus } from "@prisma/client";
import {
  dateToUtcMidnight,
  SLOTS_PER_DAY
} from "@/lib/day-slots";
import { formatYmdInOffset } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const JST_OFFSET = "+09:00";

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function buildWeekDates(from: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}

/** Slot index → slotMs from JST midnight */
function slotMs(slot: number) {
  return slot * 30 * 60_000;
}

/** Map appointments to per-slot details for a given JST date. */
function buildBookedSlots(
  ymd: string,
  appointments: Array<{
    id: bigint;
    bookingNo: string;
    startAt: Date;
    endAt: Date;
    customer: { name: string };
    servicePackage: { nameZh: string; nameJa: string };
  }>
) {
  const midnightMs = new Date(`${ymd}T00:00:00${JST_OFFSET}`).getTime();
  const slotMap = new Map<
    number,
    { slot: number; appointmentId: string; bookingNo: string; customerName: string; packageNameZh: string; packageNameJa: string }
  >();

  for (const appt of appointments) {
    const startSlot = Math.floor((appt.startAt.getTime() - midnightMs) / (30 * 60_000));
    const endSlot = Math.ceil((appt.endAt.getTime() - midnightMs) / (30 * 60_000));
    for (let s = Math.max(0, startSlot); s < Math.min(SLOTS_PER_DAY, endSlot); s++) {
      if (!slotMap.has(s)) {
        slotMap.set(s, {
          slot: s,
          appointmentId: appt.id.toString(),
          bookingNo: appt.bookingNo,
          customerName: appt.customer.name,
          packageNameZh: appt.servicePackage.nameZh,
          packageNameJa: appt.servicePackage.nameJa
        });
      }
    }
  }

  return [...slotMap.values()].sort((a, b) => a.slot - b.slot);
}

/** GET /api/admin/schedule/week?from=YYYY-MM-DD */
export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from") ?? "";
    if (!DATE_PATTERN.test(from)) {
      return NextResponse.json({ error: "from (YYYY-MM-DD) is required" }, { status: 400 });
    }

    const dates = buildWeekDates(from);
    const rangeStart = new Date(`${dates[0]}T00:00:00${JST_OFFSET}`);
    const rangeEnd = new Date(`${dates[6]}T23:59:59${JST_OFFSET}`);

    const [slotsRows, appointments] = await Promise.all([
      prisma.daySlot.findMany({
        where: {
          date: {
            gte: dateToUtcMidnight(dates[0]),
            lte: dateToUtcMidnight(dates[6])
          }
        },
        select: { date: true, slot: true },
        orderBy: [{ date: "asc" }, { slot: "asc" }]
      }),
      prisma.appointment.findMany({
        where: {
          status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart }
        },
        select: {
          id: true,
          bookingNo: true,
          startAt: true,
          endAt: true,
          customer: { select: { name: true } },
          servicePackage: { select: { nameZh: true, nameJa: true } }
        }
      })
    ]);

    // Group open slots by date (DATE stored as UTC midnight → use "+00:00" to get ymd)
    const slotsByDate = new Map<string, number[]>();
    for (const row of slotsRows) {
      const ymd = formatYmdInOffset(row.date, "+00:00");
      const list = slotsByDate.get(ymd) ?? [];
      list.push(row.slot);
      slotsByDate.set(ymd, list);
    }

    // Group appointments by JST date
    const apptsByDate = new Map<string, typeof appointments>();
    for (const appt of appointments) {
      const ymd = formatYmdInOffset(appt.startAt, JST_OFFSET);
      const list = apptsByDate.get(ymd) ?? [];
      list.push(appt);
      apptsByDate.set(ymd, list);
    }

    const days = dates.map((ymd) => ({
      date: ymd,
      slots: slotsByDate.get(ymd) ?? [],
      bookedSlots: buildBookedSlots(ymd, apptsByDate.get(ymd) ?? [])
    }));

    return NextResponse.json({ from, days });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch week schedule", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

const dayUpdateSchema = z.object({
  date: z.string().regex(DATE_PATTERN),
  slots: z.array(z.number().int().min(0).max(SLOTS_PER_DAY - 1)).max(SLOTS_PER_DAY)
});

/** PUT /api/admin/schedule/week  body: { date, slots } — replaces all slots for a single day. */
export async function PUT(request: NextRequest) {
  try {
    const body = dayUpdateSchema.parse(await request.json());
    const dateObj = dateToUtcMidnight(body.date);
    const uniqueSlots = [...new Set(body.slots)];

    await prisma.$transaction([
      prisma.daySlot.deleteMany({ where: { date: dateObj } }),
      prisma.daySlot.createMany({
        data: uniqueSlots.map((slot) => ({ date: dateObj, slot }))
      })
    ]);

    return NextResponse.json({ date: body.date, slots: uniqueSlots.sort((a, b) => a - b) });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request", details: err.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to save day slots", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
