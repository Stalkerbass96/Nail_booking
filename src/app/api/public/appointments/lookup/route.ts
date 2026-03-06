import { normalizeEmail } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const emailRaw = request.nextUrl.searchParams.get("email") ?? "";
    const bookingNo = request.nextUrl.searchParams.get("bookingNo") ?? "";
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";

    if (!emailRaw || !bookingNo) {
      return NextResponse.json({ error: "email and bookingNo are required" }, { status: 400 });
    }

    const email = normalizeEmail(emailRaw);

    const appointment = await prisma.appointment.findUnique({
      where: { bookingNo },
      include: {
        customer: {
          select: {
            email: true,
            name: true
          }
        },
        servicePackage: {
          select: {
            nameZh: true,
            nameJa: true
          }
        },
        addons: {
          include: {
            addon: {
              select: {
                nameZh: true,
                nameJa: true
              }
            }
          }
        }
      }
    });

    if (!appointment || normalizeEmail(appointment.customer.email) !== email) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const packageName = lang === "ja" ? appointment.servicePackage.nameJa : appointment.servicePackage.nameZh;
    const addons = appointment.addons.map((item) =>
      lang === "ja" ? item.addon.nameJa : item.addon.nameZh
    );

    return NextResponse.json({
      bookingNo: appointment.bookingNo,
      customerName: appointment.customer.name,
      status: appointment.status,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      packageName,
      addons,
      styleNote: appointment.styleNote,
      customerNote: appointment.customerNote
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to lookup appointment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
