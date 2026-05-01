import { AppointmentSourceChannel, AppointmentStatus, CustomerType, Prisma } from "@prisma/client";
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
import { sendPendingBookingMessage } from "@/lib/line-notifications";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const lineShowcaseSchema = z.object({
  entry: z.string().trim().min(1).max(120),
  showcaseItemId: z.union([z.string(), z.number().int().positive()]),
  startAt: z.string().datetime({ offset: true }),
  customerNote: z.string().max(1000).optional().nullable(),
  name: z.string().trim().min(1).max(80).optional().nullable(),
  lang: z.enum(["zh", "ja"]).optional()
});

const linePackageSchema = z.object({
  entry: z.string().trim().min(1).max(120),
  packageId: z.union([z.string(), z.number().int().positive()]),
  addonIds: z.array(z.union([z.string(), z.number().int().positive()])).optional().default([]),
  startAt: z.string().datetime({ offset: true }),
  customerNote: z.string().max(1000).optional().nullable(),
  name: z.string().trim().min(1).max(80).optional().nullable(),
  lang: z.enum(["zh", "ja"]).optional()
});

const legacySchema = z.object({
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

async function loadRuntimeSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["slot_minutes", "pending_auto_cancel_hours"] }
    }
  });

  return parseRuntimeSettings(settings);
}

function validateStartAt(startAtRaw: string, slotMinutes: number) {
  const startAt = new Date(startAtRaw);
  if (Number.isNaN(startAt.getTime())) {
    throw new ApiError(400, "Invalid startAt");
  }

  if (startAt <= new Date()) {
    throw new ApiError(400, "startAt must be in the future");
  }

  if (!isAlignedToSlot(startAt, slotMinutes)) {
    throw new ApiError(400, `startAt must align to ${slotMinutes}-minute slots`);
  }

  return startAt;
}

async function assertBookableRange(input: {
  startAt: Date;
  endAt: Date;
  bookingYmd: string;
  runtime: { pendingAutoCancelHours: number };
}) {
  const businessWindow = await getBusinessWindowByDate(prisma, input.bookingYmd);

  if (!businessWindow.isOpen || !businessWindow.openAt || !businessWindow.closeAt) {
    throw new ApiError(400, "Store is closed for the selected date");
  }

  if (input.startAt < businessWindow.openAt || input.endAt > businessWindow.closeAt) {
    throw new ApiError(400, "Selected time is outside business hours");
  }

  return addMinutes(new Date(), input.runtime.pendingAutoCancelHours * 60);
}

async function createLegacyAppointment(payload: z.infer<typeof legacySchema>) {
  const packageId = parseSingleBigInt(String(payload.packageId), "packageId");
  const addonIds = Array.from(
    new Set(payload.addonIds.map((value) => parseSingleBigInt(String(value), "addonIds")))
  );

  const [runtime, servicePackage] = await Promise.all([
    loadRuntimeSettings(),
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
  if (addonIds.some((id) => !allowedAddonSet.has(id.toString()))) {
    throw new ApiError(400, "One or more addons are not allowed for the selected package");
  }

  const startAt = validateStartAt(payload.startAt, runtime.slotMinutes);
  const totalDurationMinutes = calculateTotalDurationMinutes(servicePackage, addons);
  const endAt = addMinutes(startAt, totalDurationMinutes);
  const bookingYmd = formatYmdInOffset(startAt);
  const autoCancelAt = await assertBookableRange({ startAt, endAt, bookingYmd, runtime });
  const normalizedEmail = normalizeEmail(payload.email);

  return prisma.$transaction(async (tx) => {
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

    const existingCustomer = await tx.customer.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: "asc" },
      select: { id: true, firstBookedAt: true }
    });

    const customer = existingCustomer
      ? await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: payload.name.trim(),
            email: normalizedEmail,
            customerType: CustomerType.active,
            firstBookedAt: existingCustomer.firstBookedAt ?? new Date()
          }
        })
      : await tx.customer.create({
          data: {
            name: payload.name.trim(),
            email: normalizedEmail,
            customerType: CustomerType.active,
            firstBookedAt: new Date()
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
        sourceChannel: AppointmentSourceChannel.legacy_web,
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
}

async function createLinePackageAppointment(payload: z.infer<typeof linePackageSchema>) {
  const packageId = parseSingleBigInt(String(payload.packageId), "packageId");
  const addonIds = Array.from(
    new Set((payload.addonIds ?? []).map((v) => parseSingleBigInt(String(v), "addonIds")))
  );

  const [runtime, lineUser] = await Promise.all([
    loadRuntimeSettings(),
    prisma.lineUser.findUnique({
      where: { homeEntryToken: payload.entry },
      include: { customer: true }
    })
  ]);

  if (!lineUser || !lineUser.customer) {
    throw new ApiError(403, "This booking link is invalid or expired");
  }

  const startAt = validateStartAt(payload.startAt, runtime.slotMinutes);

  const servicePackage = await prisma.servicePackage.findFirst({
    where: { id: packageId, isActive: true },
    include: { addonLinks: { select: { addonId: true } } }
  });

  if (!servicePackage) {
    throw new ApiError(404, "Package not found");
  }

  const addons = addonIds.length
    ? await prisma.serviceAddon.findMany({ where: { id: { in: addonIds }, isActive: true } })
    : [];

  if (addons.length !== addonIds.length) {
    throw new ApiError(400, "Some addons are invalid or inactive");
  }

  const allowedAddonSet = new Set(servicePackage.addonLinks.map((l) => l.addonId.toString()));
  if (addonIds.some((id) => !allowedAddonSet.has(id.toString()))) {
    throw new ApiError(400, "One or more addons are not allowed for the selected package");
  }

  const totalDurationMinutes = calculateTotalDurationMinutes(servicePackage, addons);
  const endAt = addMinutes(startAt, totalDurationMinutes);
  const bookingYmd = formatYmdInOffset(startAt);
  const autoCancelAt = await assertBookableRange({ startAt, endAt, bookingYmd, runtime });

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

    await tx.customer.update({
      where: { id: lineUser.customer!.id },
      data: {
        customerType: CustomerType.active,
        firstBookedAt: lineUser.customer!.firstBookedAt ?? new Date(),
        name:
          payload.name?.trim() ||
          lineUser.customer!.name ||
          lineUser.displayName ||
          `LINE-${lineUser.lineUserId.slice(-8)}`
      }
    });

    const bookingNo = await generateUniqueBookingNo(tx);

    return tx.appointment.create({
      data: {
        bookingNo,
        customerId: lineUser.customer!.id,
        packageId,
        sourceChannel: AppointmentSourceChannel.line_showcase,
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
  });

  if (payload.lang && lineUser.isFollowing) {
    await sendPendingBookingMessage(prisma, {
      lineUserDbId: lineUser.id,
      linePlatformUserId: lineUser.lineUserId,
      bookingNo: created.bookingNo,
      entryToken: lineUser.homeEntryToken,
      lang: payload.lang
    });
  }

  return created;
}

async function createLineShowcaseAppointment(payload: z.infer<typeof lineShowcaseSchema>) {
  const showcaseItemId = parseSingleBigInt(String(payload.showcaseItemId), "showcaseItemId");
  const runtime = await loadRuntimeSettings();
  const startAt = validateStartAt(payload.startAt, runtime.slotMinutes);

  const lineUser = await prisma.lineUser.findUnique({
    where: { homeEntryToken: payload.entry },
    include: {
      customer: true
    }
  });

  if (!lineUser || !lineUser.customer) {
    throw new ApiError(403, "This booking link is invalid or expired");
  }

  const showcaseItem = await prisma.showcaseItem.findFirst({
    where: { id: showcaseItemId, isPublished: true },
    include: {
      servicePackage: true
    }
  });

  if (!showcaseItem || !showcaseItem.servicePackage.isActive) {
    throw new ApiError(404, "Showcase item not found");
  }

  const totalDurationMinutes = showcaseItem.servicePackage.durationMin;
  const endAt = addMinutes(startAt, totalDurationMinutes);
  const bookingYmd = formatYmdInOffset(startAt);
  const autoCancelAt = await assertBookableRange({ startAt, endAt, bookingYmd, runtime });

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

    const bookingNo = await generateUniqueBookingNo(tx);

    await tx.customer.update({
      where: { id: lineUser.customer!.id },
      data: {
        customerType: CustomerType.active,
        firstBookedAt: lineUser.customer!.firstBookedAt ?? new Date(),
        name: payload.name?.trim() || lineUser.customer!.name || lineUser.displayName || `LINE-${lineUser.lineUserId.slice(-8)}`
      }
    });

    return tx.appointment.create({
      data: {
        bookingNo,
        customerId: lineUser.customer!.id,
        packageId: showcaseItem.servicePackageId,
        showcaseItemId: showcaseItem.id,
        sourceChannel: AppointmentSourceChannel.line_showcase,
        styleNote: null,
        customerNote: payload.customerNote ?? null,
        startAt,
        endAt,
        status: AppointmentStatus.pending,
        autoCancelAt
      },
      select: {
        bookingNo: true,
        status: true,
        autoCancelAt: true,
        startAt: true,
        endAt: true
      }
    });
  });

  if (payload.lang && lineUser.isFollowing) {
    await sendPendingBookingMessage(prisma, {
      lineUserDbId: lineUser.id,
      linePlatformUserId: lineUser.lineUserId,
      bookingNo: created.bookingNo,
      entryToken: lineUser.homeEntryToken,
      lang: payload.lang
    });
  }

  return created;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const lineParsed = lineShowcaseSchema.safeParse(rawBody);
    const linePkgParsed = !lineParsed.success ? linePackageSchema.safeParse(rawBody) : null;

    const created = lineParsed.success
      ? await createLineShowcaseAppointment(lineParsed.data)
      : linePkgParsed?.success
        ? await createLinePackageAppointment(linePkgParsed.data)
        : await createLegacyAppointment(legacySchema.parse(rawBody));

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
