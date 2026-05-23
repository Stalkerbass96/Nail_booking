import type { PrismaClient } from "@prisma/client";
import { DEFAULT_STORE_UTC_OFFSET } from "@/lib/booking-rules";

export const SLOTS_PER_DAY = 48; // 30-min slots: 0=00:00 … 47=23:30

/** UTC midnight Date used to key a calendar date in the DB (same convention as SpecialBusinessDate). */
export function dateToUtcMidnight(ymd: string): Date {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** JST midnight as an absolute UTC instant (used for slot-to-Date conversion). */
function jstMidnight(ymd: string): number {
  return new Date(`${ymd}T00:00:00${DEFAULT_STORE_UTC_OFFSET}`).getTime();
}

/** Convert a slot index (0–48) to an absolute UTC Date for the given JST date. */
export function slotToDate(ymd: string, slotIndex: number): Date {
  return new Date(jstMidnight(ymd) + slotIndex * 30 * 60_000);
}

/** Convert an absolute UTC Date to the 30-min slot index within the given JST date (may be negative or ≥48 if outside the day). */
export function dateToSlot(ymd: string, dt: Date): number {
  return Math.floor((dt.getTime() - jstMidnight(ymd)) / (30 * 60_000));
}

/**
 * Merge a sorted list of slot indices into contiguous {openAt, closeAt} windows.
 * E.g. [20,21,22,24,25] → [{10:00–11:30}, {12:00–13:00}]
 */
export function slotsToWindows(
  ymd: string,
  slots: number[]
): Array<{ openAt: Date; closeAt: Date }> {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a - b);
  const windows: Array<{ openAt: Date; closeAt: Date }> = [];
  let runStart = sorted[0];
  let runEnd = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === runEnd + 1) {
      runEnd = sorted[i];
    } else {
      windows.push({ openAt: slotToDate(ymd, runStart), closeAt: slotToDate(ymd, runEnd + 1) });
      runStart = sorted[i];
      runEnd = sorted[i];
    }
  }
  windows.push({ openAt: slotToDate(ymd, runStart), closeAt: slotToDate(ymd, runEnd + 1) });
  return windows;
}

/** Fetch open slot indices for a date from DaySlot table. */
export async function getOpenSlotsForDate(
  prisma: PrismaClient,
  ymd: string
): Promise<number[]> {
  const rows = await prisma.daySlot.findMany({
    where: { date: dateToUtcMidnight(ymd) },
    select: { slot: true },
    orderBy: { slot: "asc" }
  });
  return rows.map((r) => r.slot);
}

/**
 * Given a list of appointments for a day, return which slot indices are occupied.
 * A slot is occupied if the appointment overlaps it (slot_start < apptEnd && slot_end > apptStart).
 */
export function appointmentsToBookedSlots(
  ymd: string,
  appointments: Array<{ startAt: Date; endAt: Date }>
): number[] {
  const booked = new Set<number>();
  for (const appt of appointments) {
    const startSlot = Math.floor((appt.startAt.getTime() - jstMidnight(ymd)) / (30 * 60_000));
    const endSlot = Math.ceil((appt.endAt.getTime() - jstMidnight(ymd)) / (30 * 60_000));
    for (let s = Math.max(0, startSlot); s < Math.min(SLOTS_PER_DAY, endSlot); s++) {
      booked.add(s);
    }
  }
  return [...booked].sort((a, b) => a - b);
}
