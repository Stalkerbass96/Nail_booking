import { createLineLinkToken, buildLineAccountLinkUrl } from "@/lib/line";
import { findCustomerByBookingNoAndEmail } from "@/lib/customer-identity";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const verifySchema = z.object({
  sessionToken: z.string().trim().min(1).max(120),
  bookingNo: z.string().trim().min(1).max(40),
  email: z.string().trim().email().max(120)
});

export async function POST(request: NextRequest) {
  try {
    const payload = verifySchema.parse(await request.json());
    const now = new Date();

    const session = await prisma.lineLinkSession.findFirst({
      where: {
        sessionToken: payload.sessionToken,
        consumedAt: null,
        expiresAt: { gt: now }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Link session is invalid or expired" }, { status: 400 });
    }

    const verified = await findCustomerByBookingNoAndEmail(payload.bookingNo, payload.email);
    if (!verified) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const nonce = createLineLinkToken();

    await prisma.$transaction(async (tx) => {
      await tx.lineLinkToken.create({
        data: {
          token: nonce,
          lineUserId: session.lineUserId,
          customerId: verified.customer.id,
          expiresAt: session.expiresAt
        }
      });

      await tx.lineLinkSession.update({
        where: { id: session.id },
        data: { consumedAt: new Date() }
      });
    });

    return NextResponse.json({
      redirectUrl: buildLineAccountLinkUrl(session.lineLinkToken, nonce),
      customer: {
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
        error: "Failed to verify LINE linking request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
