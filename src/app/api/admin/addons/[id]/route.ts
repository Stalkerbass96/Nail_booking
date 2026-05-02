import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateAddonSchema = z.object({
  nameZh: z.string().trim().min(1).max(120).optional(),
  nameJa: z.string().trim().min(1).max(120).optional(),
  descZh: z.string().trim().max(5000).optional().nullable(),
  descJa: z.string().trim().max(5000).optional().nullable(),
  priceJpy: z.number().int().min(0).optional(),
  durationIncreaseMin: z.number().int().min(0).optional(),
  maxQty: z.number().int().min(1).max(99).optional(),
  isActive: z.boolean().optional()
});

function ensureDuration(minutes?: number) {
  if (minutes !== undefined && minutes % 5 !== 0) {
    throw new Error("Invalid durationIncreaseMin: must be a multiple of 5");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const addonId = parseSingleBigInt(id, "addonId");
    const payload = updateAddonSchema.parse(await request.json());
    ensureDuration(payload.durationIncreaseMin);

    const exists = await prisma.serviceAddon.findUnique({ where: { id: addonId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    const updated = await prisma.serviceAddon.update({
      where: { id: addonId },
      data: payload
    });

    return NextResponse.json({ id: updated.id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    if (error instanceof Error && (error.message.startsWith("Invalid ") || error.message.includes("multiple of"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update addon", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const addonId = parseSingleBigInt(id, "addonId");

    const summary = await prisma.serviceAddon.findUnique({
      where: { id: addonId },
      select: {
        id: true,
        _count: {
          select: {
            packageLinks: true,
            appointmentAddons: true
          }
        }
      }
    });

    if (!summary) {
      return NextResponse.json({ error: "Addon not found" }, { status: 404 });
    }

    if (summary._count.packageLinks > 0 || summary._count.appointmentAddons > 0) {
      return NextResponse.json(
        { error: "Cannot delete addon that is used by packages or appointment history" },
        { status: 409 }
      );
    }

    await prisma.serviceAddon.delete({ where: { id: addonId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete addon", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
