import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updatePackageSchema = z.object({
  categoryId: z.union([z.string(), z.number().int().positive()]).optional(),
  nameZh: z.string().trim().min(1).max(120).optional(),
  nameJa: z.string().trim().min(1).max(120).optional(),
  descZh: z.string().trim().max(5000).optional().nullable(),
  descJa: z.string().trim().max(5000).optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
  priceJpy: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(5).optional(),
  isActive: z.boolean().optional(),
  addonIds: z.array(z.union([z.string(), z.number().int().positive()])).optional()
});

function ensureDuration(minutes?: number) {
  if (minutes !== undefined && minutes % 5 !== 0) {
    throw new Error("Invalid durationMin: must be a multiple of 5");
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const packageId = parseSingleBigInt(id, "packageId");
    const payload = updatePackageSchema.parse(await request.json());
    ensureDuration(payload.durationMin);

    const updated = await prisma.$transaction(async (tx) => {
      const pkg = await tx.servicePackage.findUnique({ where: { id: packageId }, select: { id: true } });
      if (!pkg) {
        throw new Error("Package not found");
      }

      const categoryId = payload.categoryId !== undefined ? parseSingleBigInt(String(payload.categoryId), "categoryId") : undefined;
      if (categoryId !== undefined) {
        const category = await tx.serviceCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
        if (!category) throw new Error("Category not found");
      }

      if (payload.addonIds !== undefined) {
        const addonIds = Array.from(new Set(payload.addonIds.map((v) => parseSingleBigInt(String(v), "addonIds"))));
        if (addonIds.length > 0) {
          const addonCount = await tx.serviceAddon.count({ where: { id: { in: addonIds } } });
          if (addonCount !== addonIds.length) {
            throw new Error("Some addonIds are invalid");
          }
        }

        await tx.packageAddonLink.deleteMany({ where: { packageId } });
        if (addonIds.length > 0) {
          await tx.packageAddonLink.createMany({
            data: addonIds.map((addonId) => ({ packageId, addonId }))
          });
        }
      }

      return tx.servicePackage.update({
        where: { id: packageId },
        data: {
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(payload.nameZh !== undefined ? { nameZh: payload.nameZh } : {}),
          ...(payload.nameJa !== undefined ? { nameJa: payload.nameJa } : {}),
          ...(payload.descZh !== undefined ? { descZh: payload.descZh } : {}),
          ...(payload.descJa !== undefined ? { descJa: payload.descJa } : {}),
          ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl } : {}),
          ...(payload.priceJpy !== undefined ? { priceJpy: payload.priceJpy } : {}),
          ...(payload.durationMin !== undefined ? { durationMin: payload.durationMin } : {}),
          ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {})
        }
      });
    });

    return NextResponse.json({ id: updated.id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    if (error instanceof Error && (error.message.startsWith("Invalid ") || error.message.includes("not found") || error.message.includes("invalid") || error.message.includes("multiple of"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update package", details: error instanceof Error ? error.message : "Unknown" },
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
    const packageId = parseSingleBigInt(id, "packageId");

    const summary = await prisma.servicePackage.findUnique({
      where: { id: packageId },
      select: {
        id: true,
        _count: {
          select: {
            appointments: true,
            showcaseItems: true
          }
        }
      }
    });

    if (!summary) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    if (summary._count.appointments > 0 || summary._count.showcaseItems > 0) {
      return NextResponse.json({ error: "Cannot delete package that is used by appointments or showcase items" }, { status: 409 });
    }

    await prisma.servicePackage.delete({ where: { id: packageId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete package", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
