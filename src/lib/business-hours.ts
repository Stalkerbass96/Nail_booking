import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_STORE_UTC_OFFSET,
  buildDateTimeWithOffset,
  getWeekdayFromYmd,
  toHHMM
} from "@/lib/booking-rules";

export type BusinessWindow = {
  isOpen: boolean;
  openAt?: Date;
  closeAt?: Date;
  source: "special" | "weekly" | "none";
};

export async function getBusinessWindowByDate(
  prisma: PrismaClient,
  ymd: string,
  utcOffset = DEFAULT_STORE_UTC_OFFSET
): Promise<BusinessWindow> {
  const specialDate = new Date(`${ymd}T00:00:00.000Z`);
  const special = await prisma.specialBusinessDate.findFirst({
    where: { date: specialDate }
  });

  if (special) {
    if (!special.isOpen || !special.openTime || !special.closeTime) {
      return { isOpen: false, source: "special" };
    }

    const openAt = buildDateTimeWithOffset(ymd, toHHMM(special.openTime), utcOffset);
    const closeAt = buildDateTimeWithOffset(ymd, toHHMM(special.closeTime), utcOffset);
    return { isOpen: true, openAt, closeAt, source: "special" };
  }

  const weekday = getWeekdayFromYmd(ymd, utcOffset);
  const weekly = await prisma.businessHour.findFirst({ where: { weekday } });

  if (!weekly || !weekly.isOpen || !weekly.openTime || !weekly.closeTime) {
    return { isOpen: false, source: "weekly" };
  }

  const openAt = buildDateTimeWithOffset(ymd, toHHMM(weekly.openTime), utcOffset);
  const closeAt = buildDateTimeWithOffset(ymd, toHHMM(weekly.closeTime), utcOffset);
  return { isOpen: true, openAt, closeAt, source: "weekly" };
}
