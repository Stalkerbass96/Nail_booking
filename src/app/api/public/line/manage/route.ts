import { findCustomerByBookingNoAndEmail } from "@/lib/customer-identity";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const manageSchema = z.object({
  bookingNo: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(120)
});

export async function POST(request: NextRequest) {
  try {
    const payload = manageSchema.parse(await request.json());
    const verified = await findCustomerByBookingNoAndEmail(payload.bookingNo, payload.email);
    if (!verified) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const lineUser = await prisma.lineUser.findFirst({
      where: { customerId: verified.customer.id },
      select: {
        id: true,
        displayName: true,
        lineUserId: true,
        linkedAt: true,
        isFollowing: true
      }
    });

    return NextResponse.json({
      customer: {
        id: verified.customer.id.toString(),
        name: verified.customer.name,
        email: verified.customer.email,
        bookingNo: verified.bookingNo
      },
      linkedLineUser: lineUser
        ? {
            id: lineUser.id.toString(),
            displayName: lineUser.displayName,
            lineUserId: lineUser.lineUserId,
            linkedAt: lineUser.linkedAt?.toISOString() ?? null,
            isFollowing: lineUser.isFollowing
          }
        : null
    });
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
        error: "Failed to load LINE binding status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = manageSchema.parse(await request.json());
    const verified = await findCustomerByBookingNoAndEmail(payload.bookingNo, payload.email);
    if (!verified) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const result = await prisma.lineUser.updateMany({
      where: { customerId: verified.customer.id },
      data: { customerId: null }
    });

    return NextResponse.json({
      ok: true,
      unlinkedCount: result.count,
      customer: {
        id: verified.customer.id.toString(),
        name: verified.customer.name,
        email: verified.customer.email
      }
    });
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
        error: "Failed to unlink LINE account",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
