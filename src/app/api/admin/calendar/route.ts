import { AppointmentStatus } from "@prisma/client";
import { buildDateTimeWithOffset } from "@/lib/booking-rules";
import { getAdminFromRequest } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const admin = await getAdminFromRequest(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  const rangeStart = buildDateTimeWithOffset(from, "00:00");
  const rangeEnd = buildDateTimeWithOffset(to, "23:59");

  const rows = await prisma.appointment.findMany({
    where: {
      startAt: { gte: rangeStart, lte: rangeEnd },
      status: { in: [AppointmentStatus.pending, AppointmentStatus.confirmed, AppointmentStatus.completed] }
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      bookingNo: true,
      startAt: true,
      endAt: true,
      status: true,
      customer: { select: { name: true } },
      servicePackage: { select: { nameZh: true, nameJa: true } }
    }
  });

  return NextResponse.json({
    appointments: rows.map((row) => ({
      id: row.id.toString(),
      bookingNo: row.bookingNo,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      status: row.status,
      customerName: row.customer.name,
      packageNameZh: row.servicePackage.nameZh,
      packageNameJa: row.servicePackage.nameJa
    }))
  });
}
