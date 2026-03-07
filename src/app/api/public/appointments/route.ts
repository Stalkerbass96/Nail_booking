import { AppointmentStatus, Prisma } from "@prisma/client";
import { findOverlappingBookingBlock } from "@/lib/booking-blocks";
import {
  addMinutes,
  calculateTotalDurationMinutes,
  formatYmdInOffset,
  generateBookingNo,
  isAlignedToSlot,
  normalizeEmail,
  parseRuntimeSettings,
  parseSingleBigInt
} from "@/lib/booking-rules";
import { getBusinessWindowByDate } from "@/lib/business-hours";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createAppointmentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  packageId: z.union([z.string(), z.number().int().positive()]),
  addonIds: z.array(z.union([z.string(), z.number().int().positive()])).optional().default([]),
  startAt: z.string().datetime({ offset: true }),
  styleNote: z.string().max(1000).optional().nullable(),
  customerNote: z.string().max(1000).optional().nullable(),
  lang: z.enum(["zh", "ja"]).optional()
});

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function generateUniqueBookingNo(tx: Prisma.TransactionClient): Promise<string> {
  for (let i = 0; i < 10; i += 1) {
    const candidate = generateBookingNo(new Date());
    const exists = await tx.appointment.findUnique({ where: { bookingNo: candidate } });
    if (!exists) return candidate;
  }

  throw new ApiError(500, "Failed to generate unique booking number");
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const payload = createAppointmentSchema.parse(rawBody);

    const packageId = parseSingleBigInt(String(payload.packageId), "packageId");
    const addonIds = Array.from(
      new Set(payload.addonIds.map((value) => parseSingleBigInt(String(value), "addonIds")))
    );

    const [settings, servicePackage] = await Promise.all([
      prisma.systemSetting.findMany({
        where: {
          key: { in: ["slot_minutes", "pending_auto_cancel_hours"] }
        }
      }),
      prisma.servicePackage.findFirst({
        where: { id: packageId, isActive: true },
        include: {
          addonLinks: {
            select: { addonId: true }
          }
        }
      })
    ]);

    if (!servicePackage) {
      throw new ApiError(404, "Package not found");
    }

    const runtime = parseRuntimeSettings(settings);

    const addons = addonIds.length
      ? await prisma.serviceAddon.findMany({
          where: {
            id: { in: addonIds },
            isActive: true
          }
        })
      : [];

    if (addons.length !== addonIds.length) {
      throw new ApiError(400, "Some addons are invalid or inactive");
    }

    const allowedAddonSet = new Set(servicePackage.addonLinks.map((link) => link.addonId.toString()));
    const hasInvalidAddon = addonIds.some((id) => !allowedAddonSet.has(id.toString()));
    if (hasInvalidAddon) {
      throw new ApiError(400, "One or more addons are not allowed for the selected package");
    }

    const startAt = new Date(payload.startAt);
    if (Number.isNaN(startAt.getTime())) {
      throw new ApiError(400, "Invalid startAt");
    }

    if (startAt <= new Date()) {
      throw new ApiError(400, "startAt must be in the future");
    }

    if (!isAlignedToSlot(startAt, runtime.slotMinutes)) {
      throw new ApiError(400, `startAt must align to ${runtime.slotMinutes}-minute slots`);
    }

    const totalDurationMinutes = calculateTotalDurationMinutes(servicePackage, addons);
    const endAt = addMinutes(startAt, totalDurationMinutes);

    const bookingYmd = formatYmdInOffset(startAt);
    const businessWindow = await getBusinessWindowByDate(prisma, bookingYmd);

    if (!businessWindow.isOpen || !businessWindow.openAt || !businessWindow.closeAt) {
      throw new ApiError(400, "Store is closed for the selected date");
    }

    if (startAt < businessWindow.openAt || endAt > businessWindow.closeAt) {
      throw new ApiError(400, "Selected time is outside business hours");
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const autoCancelAt = addMinutes(new Date(), runtime.pendingAutoCancelHours * 60);

    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${bookingYmd}))`;

      const [hasConflict, blocked] = await Promise.all([
        tx.appointment.findFirst({
          where: {
            status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
            startAt: { lt: endAt },
            endAt: { gt: startAt }
          },
          select: { id: true }
        }),
        findOverlappingBookingBlock(tx, startAt, endAt)
      ]);

      if (hasConflict) {
        throw new ApiError(409, "Selected time slot is no longer available");
      }

      if (blocked) {
        throw new ApiError(409, blocked.reason || "Selected time is blocked by the store owner");
      }

      const customer = await tx.customer.upsert({
        where: { email: normalizedEmail },
        create: {
          name: payload.name.trim(),
          email: normalizedEmail
        },
        update: {
          name: payload.name.trim()
        }
      });

      const bookingNo = await generateUniqueBookingNo(tx);

      const appointment = await tx.appointment.create({
        data: {
          bookingNo,
          customerId: customer.id,
          packageId,
          styleNote: payload.styleNote ?? null,
          customerNote: payload.customerNote ?? null,
          startAt,
          endAt,
          status: AppointmentStatus.pending,
          autoCancelAt,
          addons: {
            create: addons.map((addon) => ({
              addonId: addon.id,
              priceSnapshotJpy: addon.priceJpy,
              durationSnapshotMin: addon.durationIncreaseMin
            }))
          }
        },
        select: {
          bookingNo: true,
          status: true,
          autoCancelAt: true,
          startAt: true,
          endAt: true
        }
      });

      return appointment;
    });

    return NextResponse.json(
      {
        bookingNo: created.bookingNo,
        status: created.status,
        autoCancelAt: created.autoCancelAt.toISOString(),
        startAt: created.startAt.toISOString(),
        endAt: created.endAt.toISOString()
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

