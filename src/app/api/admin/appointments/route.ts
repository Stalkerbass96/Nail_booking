import { AppointmentStatus, Prisma } from "@prisma/client";
import { buildDateTimeWithOffset } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_STATUSES = new Set(Object.values(AppointmentStatus));
const VALID_SOURCE_CHANNELS = new Set(["line_showcase", "admin_manual", "legacy_web"] as const);

function buildFilter(request: NextRequest): Prisma.AppointmentWhereInput {
  const statusRaw = request.nextUrl.searchParams.get("status");
  const dateRaw = request.nextUrl.searchParams.get("date");
  const sourceChannelRaw = request.nextUrl.searchParams.get("sourceChannel");

  const where: Prisma.AppointmentWhereInput = {};

  if (statusRaw) {
    if (!VALID_STATUSES.has(statusRaw as AppointmentStatus)) {
      throw new Error("Invalid status");
    }
    where.status = statusRaw as AppointmentStatus;
  }

  if (sourceChannelRaw) {
    if (!VALID_SOURCE_CHANNELS.has(sourceChannelRaw as "line_showcase" | "admin_manual" | "legacy_web")) {
      throw new Error("Invalid source channel");
    }
    where.sourceChannel = sourceChannelRaw as "line_showcase" | "admin_manual" | "legacy_web";
  }

  if (dateRaw) {
    if (!DATE_PATTERN.test(dateRaw)) {
      throw new Error("Invalid date");
    }

    const start = buildDateTimeWithOffset(dateRaw, "00:00");
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    where.startAt = {
      gte: start,
      lt: end
    };
  }

  return where;
}

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";
    const limitRaw = request.nextUrl.searchParams.get("limit") ?? "50";
    const limitNum = Number.parseInt(limitRaw, 10);
    const take = Number.isFinite(limitNum) ? Math.min(Math.max(limitNum, 1), 200) : 50;

    const where = buildFilter(request);

    const appointments = await prisma.appointment.findMany({
      where,
      take,
      orderBy: {
        startAt: "asc"
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            customerType: true,
            lineUser: {
              select: {
                id: true,
                lineUserId: true,
                displayName: true,
                isFollowing: true
              }
            }
          }
        },
        servicePackage: {
          select: {
            id: true,
            nameZh: true,
            nameJa: true
          }
        },
        showcaseItem: {
          select: {
            id: true,
            titleZh: true,
            titleJa: true
          }
        },
        addons: {
          include: {
            addon: {
              select: {
                id: true,
                nameZh: true,
                nameJa: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      items: appointments.map((item) => ({
        id: item.id.toString(),
        bookingNo: item.bookingNo,
        status: item.status,
        startAt: item.startAt.toISOString(),
        endAt: item.endAt.toISOString(),
        sourceChannel: item.sourceChannel,
        customer: {
          name: item.customer.name,
          email: item.customer.email,
          customerType: item.customer.customerType,
          lineUser: item.customer.lineUser
            ? {
                id: item.customer.lineUser.id.toString(),
                lineUserId: item.customer.lineUser.lineUserId,
                displayName: item.customer.lineUser.displayName,
                isFollowing: item.customer.lineUser.isFollowing
              }
            : null
        },
        package: {
          id: item.servicePackage.id.toString(),
          name: lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh
        },
        showcaseItem: item.showcaseItem
          ? {
              id: item.showcaseItem.id.toString(),
              title: lang === "ja" ? item.showcaseItem.titleJa : item.showcaseItem.titleZh
            }
          : null,
        addons: item.addons.map((addon) => ({
          id: addon.addon.id.toString(),
          name: lang === "ja" ? addon.addon.nameJa : addon.addon.nameZh
        }))
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch appointments",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
