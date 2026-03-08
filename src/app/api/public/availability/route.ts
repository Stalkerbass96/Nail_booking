import { AppointmentStatus } from "@prisma/client";
import { overlapsWithBlockedRanges } from "@/lib/booking-blocks";
import { prisma } from "@/lib/db";
import {
  addMinutes,
  calculateTotalDurationMinutes,
  generateStartSlots,
  overlapsWithAppointments,
  parseBigIntList,
  parseRuntimeSettings,
  parseSingleBigInt
} from "@/lib/booking-rules";
import { getBusinessWindowByDate } from "@/lib/business-hours";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function resolvePackageDuration(params: {
  packageIdRaw: string | null;
  showcaseItemIdRaw: string | null;
  addonIdsRaw: string | null;
}) {
  if (params.showcaseItemIdRaw) {
    const showcaseItemId = parseSingleBigInt(params.showcaseItemIdRaw, "showcaseItemId");
    const showcaseItem = await prisma.showcaseItem.findFirst({
      where: { id: showcaseItemId, isPublished: true },
      include: {
        servicePackage: {
          include: {
            addonLinks: {
              select: { addonId: true }
            }
          }
        }
      }
    });

    if (!showcaseItem || !showcaseItem.servicePackage.isActive) {
      return null;
    }

    return {
      packageId: showcaseItem.servicePackageId,
      totalDurationMinutes: showcaseItem.servicePackage.durationMin,
      packageFound: true
    };
  }

  if (!params.packageIdRaw) {
    throw new Error("packageId or showcaseItemId is required");
  }

  const packageId = parseSingleBigInt(params.packageIdRaw, "packageId");
  const addonIds = Array.from(new Set(parseBigIntList(params.addonIdsRaw)));

  const servicePackage = await prisma.servicePackage.findFirst({
    where: { id: packageId, isActive: true },
    include: {
      addonLinks: {
        select: { addonId: true }
      }
    }
  });

  if (!servicePackage) {
    return null;
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
    throw new Error("Some addons are invalid or inactive");
  }

  const allowedAddonSet = new Set(servicePackage.addonLinks.map((link) => link.addonId.toString()));
  if (addonIds.some((id) => !allowedAddonSet.has(id.toString()))) {
    throw new Error("One or more addons are not allowed for the selected package");
  }

  return {
    packageId,
    totalDurationMinutes: calculateTotalDurationMinutes(servicePackage, addons),
    packageFound: true
  };
}

export async function GET(request: NextRequest) {
  try {
    const packageIdRaw = request.nextUrl.searchParams.get("packageId");
    const showcaseItemIdRaw = request.nextUrl.searchParams.get("showcaseItemId");
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const addonIdsRaw = request.nextUrl.searchParams.get("addonIds");

    if ((!packageIdRaw && !showcaseItemIdRaw) || !DATE_PATTERN.test(date)) {
      return NextResponse.json(
        { error: "packageId/showcaseItemId and date(YYYY-MM-DD) are required" },
        { status: 400 }
      );
    }

    const [settings, resolved] = await Promise.all([
      prisma.systemSetting.findMany({
        where: {
          key: { in: ["slot_minutes", "pending_auto_cancel_hours"] }
        }
      }),
      resolvePackageDuration({ packageIdRaw, showcaseItemIdRaw, addonIdsRaw })
    ]);

    if (!resolved) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const runtime = parseRuntimeSettings(settings);
    const businessWindow = await getBusinessWindowByDate(prisma, date);

    if (!businessWindow.isOpen || !businessWindow.openAt || !businessWindow.closeAt) {
      return NextResponse.json({
        date,
        slotMinutes: runtime.slotMinutes,
        totalDurationMinutes: resolved.totalDurationMinutes,
        slots: []
      });
    }

    if (businessWindow.closeAt <= businessWindow.openAt) {
      return NextResponse.json({ error: "Invalid business hours range" }, { status: 422 });
    }

    const [occupiedAppointments, bookingBlocks] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed] },
          startAt: { lt: businessWindow.closeAt },
          endAt: { gt: businessWindow.openAt }
        },
        select: {
          startAt: true,
          endAt: true,
          status: true
        }
      }),
      prisma.bookingBlock.findMany({
        where: {
          startAt: { lt: businessWindow.closeAt },
          endAt: { gt: businessWindow.openAt }
        },
        select: {
          startAt: true,
          endAt: true,
          reason: true
        },
        orderBy: { startAt: "asc" }
      })
    ]);

    const candidateStarts = generateStartSlots(
      businessWindow.openAt,
      businessWindow.closeAt,
      resolved.totalDurationMinutes,
      runtime.slotMinutes
    );

    const slots = candidateStarts
      .filter((startAt) => {
        const endAt = addMinutes(startAt, resolved.totalDurationMinutes);
        if (overlapsWithAppointments(startAt, endAt, occupiedAppointments)) {
          return false;
        }

        if (overlapsWithBlockedRanges(startAt, endAt, bookingBlocks)) {
          return false;
        }

        return true;
      })
      .map((startAt) => ({
        startAt: startAt.toISOString(),
        endAt: addMinutes(startAt, resolved.totalDurationMinutes).toISOString()
      }));

    return NextResponse.json({
      date,
      slotMinutes: runtime.slotMinutes,
      totalDurationMinutes: resolved.totalDurationMinutes,
      slots,
      blockedCount: bookingBlocks.length
    });
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("Invalid ") || error.message.includes("required") || error.message.includes("addons"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to calculate availability",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
