import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function findOverlappingBookingBlock(
  prisma: DbClient,
  startAt: Date,
  endAt: Date
) {
  return prisma.bookingBlock.findFirst({
    where: {
      startAt: { lt: endAt },
      endAt: { gt: startAt }
    },
    orderBy: { startAt: "asc" }
  });
}

export function overlapsWithBlockedRanges(
  startAt: Date,
  endAt: Date,
  blocks: Array<{ startAt: Date; endAt: Date }>
): boolean {
  return blocks.some((block) => block.startAt < endAt && block.endAt > startAt);
}
