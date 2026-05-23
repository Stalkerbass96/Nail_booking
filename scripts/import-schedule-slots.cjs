/**
 * import-schedule-slots.cjs
 *
 * One-time migration: reads BusinessHour + SpecialBusinessDate + BookingBlock
 * and writes DaySlot rows for the next DAYS_AHEAD days.
 *
 * Idempotent: skips any date that already has DaySlot rows.
 * Safe to re-run; never modifies existing data.
 */

"use strict";

const { PrismaClient } = require("@prisma/client");

const DAYS_AHEAD = 120; // generate slots for 4 months ahead
const STORE_OFFSET_MS = 9 * 60 * 60 * 1000; // JST = UTC+9

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" for a UTC Date object (used for DATE-keyed DB lookups). */
function toUtcYmd(d) {
  return d.toISOString().slice(0, 10);
}

/** JST "YYYY-MM-DD" from an arbitrary Date. */
function toJstYmd(d) {
  return new Date(d.getTime() + STORE_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC midnight Date (DATE column convention matching SpecialBusinessDate). */
function utcMidnight(ymd) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

/** JST midnight as absolute UTC instant (for slot arithmetic). */
function jstMidnightMs(ymd) {
  return new Date(`${ymd}T00:00:00+09:00`).getTime();
}

/** Extract HH:MM from a Prisma Time field (stored as 1970-01-01 UTC). */
function toHHMM(timeDate) {
  const h = String(timeDate.getUTCHours()).padStart(2, "0");
  const m = String(timeDate.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Return slot indices [openSlot, closeSlot) for an HH:MM open/close pair. */
function windowToSlots(openHhmm, closeHhmm) {
  const [oh, om] = openHhmm.split(":").map(Number);
  const [ch, cm] = closeHhmm.split(":").map(Number);
  const openSlot = Math.floor((oh * 60 + om) / 30);
  const closeSlot = Math.floor((ch * 60 + cm) / 30);
  const slots = [];
  for (let s = openSlot; s < closeSlot; s++) slots.push(s);
  return slots;
}

/** Return true if the given 30-min slot on `ymd` overlaps a BookingBlock. */
function slotIsBlocked(ymd, slot, blocks) {
  const slotStartMs = jstMidnightMs(ymd) + slot * 30 * 60_000;
  const slotEndMs = slotStartMs + 30 * 60_000;
  return blocks.some(
    (b) => b.startAt.getTime() < slotEndMs && b.endAt.getTime() > slotStartMs
  );
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const now = new Date();
  const todayJst = toJstYmd(now);

  console.log(`[import-slots] starting – today JST: ${todayJst}, days ahead: ${DAYS_AHEAD}`);

  // Load static data once
  const [weeklyHours, futureBlocks] = await Promise.all([
    prisma.businessHour.findMany(),
    prisma.bookingBlock.findMany({ where: { endAt: { gte: now } } })
  ]);

  const weeklyByDay = new Map(weeklyHours.map((h) => [h.weekday, h]));

  let created = 0;
  let skipped = 0;
  let empty = 0;

  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    // Build this day's JST date string
    const dayMs = new Date(
      Date.UTC(
        new Date(now.getTime() + STORE_OFFSET_MS).getUTCFullYear(),
        new Date(now.getTime() + STORE_OFFSET_MS).getUTCMonth(),
        new Date(now.getTime() + STORE_OFFSET_MS).getUTCDate() + offset
      )
    );
    const ymd = toUtcYmd(dayMs); // YYYY-MM-DD in JST (stored as UTC midnight)

    // Skip if DaySlot rows already exist for this date (idempotent)
    const existing = await prisma.daySlot.count({ where: { date: utcMidnight(ymd) } });
    if (existing > 0) {
      skipped++;
      continue;
    }

    // Resolve business window: special date takes priority over weekly
    let openSlots = [];

    const special = await prisma.specialBusinessDate.findFirst({
      where: { date: utcMidnight(ymd) }
    });

    if (special) {
      if (special.isOpen && special.openTime && special.closeTime) {
        openSlots = windowToSlots(toHHMM(special.openTime), toHHMM(special.closeTime));
      }
      // else: explicitly closed special date → no slots
    } else {
      // Use weekday from JST noon to avoid DST edge cases
      const weekday = new Date(`${ymd}T12:00:00+09:00`).getUTCDay();
      const weekly = weeklyByDay.get(weekday);
      if (weekly && weekly.isOpen && weekly.openTime && weekly.closeTime) {
        openSlots = windowToSlots(toHHMM(weekly.openTime), toHHMM(weekly.closeTime));
      }
    }

    // Subtract booking-block exclusions
    const unblockedSlots = openSlots.filter((s) => !slotIsBlocked(ymd, s, futureBlocks));

    if (unblockedSlots.length === 0) {
      empty++;
      continue;
    }

    await prisma.daySlot.createMany({
      data: unblockedSlots.map((slot) => ({ date: utcMidnight(ymd), slot }))
    });

    console.log(`[import-slots] ${ymd}: created ${unblockedSlots.length} slots`);
    created++;
  }

  console.log(
    `[import-slots] done – ${created} days created, ${skipped} days skipped (already had slots), ${empty} days closed/empty`
  );
}

main()
  .catch((err) => {
    console.error("[import-slots] fatal error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
