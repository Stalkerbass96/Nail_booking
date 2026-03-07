import { prisma } from "@/lib/db";
import { toHHMM } from "@/lib/booking-rules";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

const weeklyItemSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    isOpen: z.boolean(),
    openTime: z.string().regex(TIME_PATTERN).nullable().optional(),
    closeTime: z.string().regex(TIME_PATTERN).nullable().optional()
  })
  .superRefine((value, ctx) => {
    if (!value.isOpen) return;
    if (!value.openTime || !value.closeTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "openTime and closeTime are required" });
      return;
    }
    if (value.openTime >= value.closeTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "closeTime must be later than openTime" });
    }
  });

const weeklyUpdateSchema = z.object({
  weeklyHours: z.array(weeklyItemSchema).min(1)
});

const specialDateSchema = z
  .object({
    type: z.literal("specialDate"),
    date: z.string().regex(DATE_PATTERN),
    isOpen: z.boolean(),
    openTime: z.string().regex(TIME_PATTERN).nullable().optional(),
    closeTime: z.string().regex(TIME_PATTERN).nullable().optional(),
    note: z.string().max(255).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (!value.isOpen) return;
    if (!value.openTime || !value.closeTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "openTime and closeTime are required" });
      return;
    }
    if (value.openTime >= value.closeTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "closeTime must be later than openTime" });
    }
  });

const bookingBlockSchema = z
  .object({
    type: z.literal("block"),
    startAt: z.string().datetime({ offset: true }),
    endAt: z.string().datetime({ offset: true }),
    reason: z.string().max(255).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (new Date(value.startAt) >= new Date(value.endAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endAt must be later than startAt" });
    }
  });

function fixedTime(hhmm: string) {
  const [hour, minute] = hhmm.split(":").map((item) => Number.parseInt(item, 10));
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

function startOfUtcDate(ymd: string) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

async function getSchedulePayload() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const specialUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const specialUntilYmd = specialUntil.toISOString().slice(0, 10);
  const blockUntil = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000);

  const [weeklyRows, specialRows, blockRows] = await Promise.all([
    prisma.businessHour.findMany({ orderBy: { weekday: "asc" } }),
    prisma.specialBusinessDate.findMany({
      where: {
        date: {
          gte: startOfUtcDate(today),
          lte: startOfUtcDate(specialUntilYmd)
        }
      },
      orderBy: { date: "asc" }
    }),
    prisma.bookingBlock.findMany({
      where: { endAt: { gte: now }, startAt: { lte: blockUntil } },
      orderBy: { startAt: "asc" }
    })
  ]);

  const weeklyByDay = new Map(weeklyRows.map((item) => [item.weekday, item]));

  return {
    weeklyHours: Array.from({ length: 7 }, (_, weekday) => {
      const item = weeklyByDay.get(weekday);
      return {
        weekday,
        isOpen: item?.isOpen ?? false,
        openTime: item?.openTime ? toHHMM(item.openTime) : null,
        closeTime: item?.closeTime ? toHHMM(item.closeTime) : null
      };
    }),
    specialDates: specialRows.map((item) => ({
      id: item.id.toString(),
      date: item.date.toISOString().slice(0, 10),
      isOpen: item.isOpen,
      openTime: item.openTime ? toHHMM(item.openTime) : null,
      closeTime: item.closeTime ? toHHMM(item.closeTime) : null,
      note: item.note
    })),
    bookingBlocks: blockRows.map((item) => ({
      id: item.id.toString(),
      startAt: item.startAt.toISOString(),
      endAt: item.endAt.toISOString(),
      reason: item.reason
    }))
  };
}

export async function GET() {
  try {
    return NextResponse.json(await getSchedulePayload());
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch schedule",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = weeklyUpdateSchema.parse(await request.json());
    const existingRows = await prisma.businessHour.findMany();
    const existingByWeekday = new Map(existingRows.map((item) => [item.weekday, item]));

    await prisma.$transaction(
      payload.weeklyHours.map((item) => {
        const existing = existingByWeekday.get(item.weekday);
        const data = {
          weekday: item.weekday,
          isOpen: item.isOpen,
          openTime: item.isOpen && item.openTime ? fixedTime(item.openTime) : null,
          closeTime: item.isOpen && item.closeTime ? fixedTime(item.closeTime) : null
        };

        if (existing) {
          return prisma.businessHour.update({
            where: { id: existing.id },
            data
          });
        }

        return prisma.businessHour.create({ data });
      })
    );

    return NextResponse.json(await getSchedulePayload());
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

    return NextResponse.json(
      {
        error: "Failed to update weekly schedule",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();

    if (raw?.type === "specialDate") {
      const payload = specialDateSchema.parse(raw);
      await prisma.specialBusinessDate.upsert({
        where: { date: startOfUtcDate(payload.date) },
        create: {
          date: startOfUtcDate(payload.date),
          isOpen: payload.isOpen,
          openTime: payload.isOpen && payload.openTime ? fixedTime(payload.openTime) : null,
          closeTime: payload.isOpen && payload.closeTime ? fixedTime(payload.closeTime) : null,
          note: payload.note?.trim() || null
        },
        update: {
          isOpen: payload.isOpen,
          openTime: payload.isOpen && payload.openTime ? fixedTime(payload.openTime) : null,
          closeTime: payload.isOpen && payload.closeTime ? fixedTime(payload.closeTime) : null,
          note: payload.note?.trim() || null
        }
      });
    } else {
      const payload = bookingBlockSchema.parse(raw);
      await prisma.bookingBlock.create({
        data: {
          startAt: new Date(payload.startAt),
          endAt: new Date(payload.endAt),
          reason: payload.reason?.trim() || null
        }
      });
    }

    return NextResponse.json(await getSchedulePayload(), { status: 201 });
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

    return NextResponse.json(
      {
        error: "Failed to save schedule item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
