import { AppointmentStatus } from "@prisma/client";
import { findOverlappingBookingBlock, overlapsWithBlockedRanges } from "@/lib/booking-blocks";
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

export async function GET(request: NextRequest) {
  try {
    const packageIdRaw = request.nextUrl.searchParams.get("packageId") ?? "";
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const addonIdsRaw = request.nextUrl.searchParams.get("addonIds");

    if (!packageIdRaw || !DATE_PATTERN.test(date)) {
      return NextResponse.json(
        { error: "packageId and date(YYYY-MM-DD) are required" },
        { status: 400 }
      );
    }

    const packageId = parseSingleBigInt(packageIdRaw, "packageId");
    const addonIds = Array.from(new Set(parseBigIntList(addonIdsRaw)));

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
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
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
      return NextResponse.json({ error: "Some addons are invalid or inactive" }, { status: 400 });
    }

    const allowedAddonSet = new Set(servicePackage.addonLinks.map((link) => link.addonId.toString()));
    const hasInvalidAddon = addonIds.some((id) => !allowedAddonSet.has(id.toString()));
    if (hasInvalidAddon) {
      return NextResponse.json(
        { error: "One or more addons are not allowed for the selected package" },
        { status: 400 }
      );
    }

    const totalDurationMinutes = calculateTotalDurationMinutes(servicePackage, addons);
    const businessWindow = await getBusinessWindowByDate(prisma, date);

    if (!businessWindow.isOpen || !businessWindow.openAt || !businessWindow.closeAt) {
      return NextResponse.json({
        date,
        slotMinutes: runtime.slotMinutes,
        totalDurationMinutes,
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
      totalDurationMinutes,
      runtime.slotMinutes
    );

    const slots = candidateStarts
      .filter((startAt) => {
        const endAt = addMinutes(startAt, totalDurationMinutes);
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
        endAt: addMinutes(startAt, totalDurationMinutes).toISOString()
      }));

    return NextResponse.json({
      date,
      slotMinutes: runtime.slotMinutes,
      totalDurationMinutes,
      slots,
      blockedCount: bookingBlocks.length
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
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
