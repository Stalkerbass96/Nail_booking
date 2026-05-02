import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createPackageSchema = z.object({
  categoryId: z.union([z.string(), z.number().int().positive()]),
  nameZh: z.string().trim().min(1).max(120),
  nameJa: z.string().trim().min(1).max(120),
  descZh: z.string().trim().max(5000).optional().nullable(),
  descJa: z.string().trim().max(5000).optional().nullable(),
  imageUrl: z.string().trim().max(1000).optional().nullable(),
  priceJpy: z.number().int().min(0),
  durationMin: z.number().int().min(5),
  isActive: z.boolean().optional().default(true),
  addonIds: z.array(z.union([z.string(), z.number().int().positive()])).optional().default([])
});

function ensureDuration(minutes: number) {
  if (minutes % 5 !== 0) {
    throw new Error("Invalid durationMin: must be a multiple of 5");
  }
}

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";

    const items = await prisma.servicePackage.findMany({
      include: {
        category: {
          select: { id: true, nameZh: true, nameJa: true }
        },
        addonLinks: {
          select: { addonId: true }
        }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }]
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        name: lang === "ja" ? item.nameJa : item.nameZh,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        descZh: item.descZh,
        descJa: item.descJa,
        imageUrl: item.imageUrl,
        priceJpy: item.priceJpy,
        durationMin: item.durationMin,
        isActive: item.isActive,
        category: {
          id: item.category.id.toString(),
          nameZh: item.category.nameZh,
          nameJa: item.category.nameJa
        },
        addonIds: item.addonLinks.map((a) => a.addonId.toString())
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch packages", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createPackageSchema.parse(await request.json());
    ensureDuration(payload.durationMin);

    const categoryId = parseSingleBigInt(String(payload.categoryId), "categoryId");
    const addonIds = Array.from(new Set(payload.addonIds.map((v) => parseSingleBigInt(String(v), "addonIds"))));

    const created = await prisma.$transaction(async (tx) => {
      const category = await tx.serviceCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
      if (!category) {
        throw new Error("Category not found");
      }

      if (addonIds.length > 0) {
        const addonCount = await tx.serviceAddon.count({ where: { id: { in: addonIds } } });
        if (addonCount !== addonIds.length) {
          throw new Error("Some addonIds are invalid");
        }
      }

      const pkg = await tx.servicePackage.create({
        data: {
          categoryId,
          nameZh: payload.nameZh,
          nameJa: payload.nameJa,
          descZh: payload.descZh ?? null,
          descJa: payload.descJa ?? null,
          imageUrl: payload.imageUrl ?? null,
          priceJpy: payload.priceJpy,
          durationMin: payload.durationMin,
          isActive: payload.isActive
        }
      });

      if (addonIds.length > 0) {
        await tx.packageAddonLink.createMany({
          data: addonIds.map((addonId) => ({ packageId: pkg.id, addonId }))
        });
      }

      return pkg;
    });

    return NextResponse.json({ id: created.id.toString() }, { status: 201 });
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
      { error: "Failed to create package", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}