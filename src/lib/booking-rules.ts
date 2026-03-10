import { AppointmentStatus, ServiceAddon, ServicePackage } from "@prisma/client";

export const DEFAULT_SLOT_MINUTES = 30;
export const DEFAULT_PENDING_AUTO_CANCEL_HOURS = 24;
export const DEFAULT_STORE_UTC_OFFSET = "+09:00";

export type RuntimeSettings = {
  slotMinutes: number;
  pendingAutoCancelHours: number;
};

export function parseRuntimeSettings(
  settings: Array<{ key: string; value: string }>
): RuntimeSettings {
  const valueByKey = new Map(settings.map((item) => [item.key, item.value]));

  return {
    slotMinutes: parsePositiveInt(valueByKey.get("slot_minutes"), DEFAULT_SLOT_MINUTES),
    pendingAutoCancelHours: parsePositiveInt(
      valueByKey.get("pending_auto_cancel_hours"),
      DEFAULT_PENDING_AUTO_CANCEL_HOURS
    )
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function getOffsetMinutes(utcOffset: string): number {
  const sign = utcOffset.startsWith("-") ? -1 : 1;
  const [hourPart, minutePart] = utcOffset.slice(1).split(":");
  return sign * (Number(hourPart) * 60 + Number(minutePart));
}

function shiftDateToOffset(base: Date, utcOffset: string): Date {
  return new Date(base.getTime() + getOffsetMinutes(utcOffset) * 60_000);
}

export function calculateTotalDurationMinutes(
  servicePackage: Pick<ServicePackage, "durationMin">,
  addons: Array<Pick<ServiceAddon, "durationIncreaseMin">>
): number {
  const addonMinutes = addons.reduce((acc, addon) => acc + addon.durationIncreaseMin, 0);
  return servicePackage.durationMin + addonMinutes;
}

export function isAlignedToSlot(date: Date, slotMinutes: number): boolean {
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % slotMinutes === 0
  );
}

export function overlapsWithAppointments(
  startAt: Date,
  endAt: Date,
  appointments: Array<{ startAt: Date; endAt: Date; status: AppointmentStatus }>
): boolean {
  return appointments.some(
    (appt) =>
      (appt.status === AppointmentStatus.pending || appt.status === AppointmentStatus.confirmed) &&
      appt.startAt < endAt &&
      appt.endAt > startAt
  );
}

export function parseDateInStoreOffset(date: string, utcOffset = DEFAULT_STORE_UTC_OFFSET): Date {
  return new Date(`${date}T00:00:00${utcOffset}`);
}

export function getWeekdayFromYmd(date: string, utcOffset = DEFAULT_STORE_UTC_OFFSET): number {
  const noon = new Date(`${date}T12:00:00${utcOffset}`);
  return noon.getUTCDay();
}

export function buildDateTimeWithOffset(
  date: string,
  hhmm: string,
  utcOffset = DEFAULT_STORE_UTC_OFFSET
): Date {
  return new Date(`${date}T${hhmm}:00${utcOffset}`);
}

export function toHHMM(timeLike: Date): string {
  const hh = String(timeLike.getUTCHours()).padStart(2, "0");
  const mm = String(timeLike.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatTimeInOffset(base: Date, utcOffset = DEFAULT_STORE_UTC_OFFSET): string {
  const shifted = shiftDateToOffset(base, utcOffset);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatDateTimeInOffset(
  base: Date,
  locale: string,
  utcOffset = DEFAULT_STORE_UTC_OFFSET
): string {
  const shifted = shiftDateToOffset(base, utcOffset);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(shifted);
}

export function generateStartSlots(
  dayStart: Date,
  dayEnd: Date,
  serviceDurationMinutes: number,
  slotMinutes: number
): Date[] {
  const latestStart = new Date(dayEnd.getTime() - serviceDurationMinutes * 60_000);
  if (latestStart < dayStart) return [];

  const slots: Date[] = [];
  for (
    let cursor = new Date(dayStart);
    cursor <= latestStart;
    cursor = new Date(cursor.getTime() + slotMinutes * 60_000)
  ) {
    slots.push(new Date(cursor));
  }

  return slots;
}

export function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

export function formatYmdInOffset(base: Date, utcOffset = DEFAULT_STORE_UTC_OFFSET): string {
  const shifted = shiftDateToOffset(base, utcOffset);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateBookingNo(now = new Date()): string {
  const ymd = formatYmdInOffset(now).replaceAll("-", "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `NB-${ymd}-${suffix}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseBigIntList(value: string | null): bigint[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => parseSingleBigInt(item, "addonIds"));
}

export function parseSingleBigInt(value: string, fieldName: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }
}
