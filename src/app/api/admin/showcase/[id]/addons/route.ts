import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function toBigInt(value: string, fieldName: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }
}

const putSchema = z.object({
  addons: z.array(
    z.object({
      addonId: z.union([z.string(), z.number().int().positive()]),
      qty: z.number().int().min(1).max(99)
    })
  )
});

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const showcaseId = toBigInt(id, "showcaseId");

    const showcaseItem = await prisma.showcaseItem.findUnique({
      where: { id: showcaseId },
      select: {
        id: true,
        servicePackageId: true,
        addonLinks: {
          include: {
            addon: {
              select: {
                id: true,
                nameZh: true,
                nameJa: true,
                priceJpy: true,
                durationIncreaseMin: true,
                maxQty: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!showcaseItem) {
      return NextResponse.json({ error: "Showcase item not found" }, { status: 404 });
    }

    const packageAddons = await prisma.packageAddonLink.findMany({
      where: { packageId: showcaseItem.servicePackageId, addon: { isActive: true } },
      include: {
        addon: {
          select: {
            id: true,
            nameZh: true,
            nameJa: true,
            priceJpy: true,
            durationIncreaseMin: true,
            maxQty: true,
            isActive: true
          }
        }
      },
      orderBy: { id: "asc" }
    });

    const currentMap = new Map(showcaseItem.addonLinks.map((l) => [l.addonId.toString(), l.qty]));

    return NextResponse.json({
      availableAddons: packageAddons.map((l) => ({
        id: l.addon.id.toString(),
        nameZh: l.addon.nameZh,
        nameJa: l.addon.nameJa,
        priceJpy: l.addon.priceJpy,
        durationIncreaseMin: l.addon.durationIncreaseMin,
        maxQty: l.addon.maxQty,
        isActive: l.addon.isActive,
        currentQty: currentMap.get(l.addon.id.toString()) ?? 0
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to fetch showcase addons", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const showcaseId = toBigInt(id, "showcaseId");
    const payload = putSchema.parse(await request.json());

    const exists = await prisma.showcaseItem.findUnique({
      where: { id: showcaseId },
      select: { id: true }
    });
    if (!exists) {
      return NextResponse.json({ error: "Showcase item not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.showcaseItemAddon.deleteMany({ where: { showcaseItemId: showcaseId } });
      if (payload.addons.length > 0) {
        await tx.showcaseItemAddon.createMany({
          data: payload.addons.map((a) => ({
            showcaseItemId: showcaseId,
            addonId: BigInt(String(a.addonId)),
            qty: a.qty
          }))
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update showcase addons", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
