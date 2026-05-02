import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const showcaseSchema = z.object({
  categoryId: z.union([z.string(), z.number().int().positive()]),
  servicePackageId: z.union([z.string(), z.number().int().positive()]),
  titleZh: z.string().trim().min(1).max(120),
  titleJa: z.string().trim().min(1).max(120),
  descriptionZh: z.string().trim().max(2000).nullable().optional(),
  descriptionJa: z.string().trim().max(2000).nullable().optional(),
  imageUrl: z.string().trim().url().max(2000),
  sortOrder: z.number().int().min(0).max(9999),
  isPublished: z.boolean().optional().default(true),
  hideAddonDetails: z.boolean().optional().default(false),
  customPriceJpy: z.number().int().positive().nullable().optional()
});

function toBigInt(value: string | number, fieldName: string) {
  try {
    return BigInt(String(value));
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }
}

function normalizePayload(payload: z.infer<typeof showcaseSchema>) {
  return {
    categoryId: toBigInt(payload.categoryId, "categoryId"),
    servicePackageId: toBigInt(payload.servicePackageId, "servicePackageId"),
    titleZh: payload.titleZh.trim(),
    titleJa: payload.titleJa.trim(),
    descriptionZh: payload.descriptionZh?.trim() || null,
    descriptionJa: payload.descriptionJa?.trim() || null,
    imageUrl: payload.imageUrl.trim(),
    sortOrder: payload.sortOrder,
    isPublished: payload.isPublished,
    hideAddonDetails: payload.hideAddonDetails,
    customPriceJpy: payload.customPriceJpy ?? null
  };
}

export async function GET() {
  try {
    const items = await prisma.showcaseItem.findMany({
      include: {
        category: {
          select: { id: true, nameZh: true, nameJa: true }
        },
        servicePackage: {
          select: { id: true, nameZh: true, nameJa: true, priceJpy: true, durationMin: true, isActive: true }
        },
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        titleZh: item.titleZh,
        titleJa: item.titleJa,
        descriptionZh: item.descriptionZh,
        descriptionJa: item.descriptionJa,
        imageUrl: item.imageUrl,
        sortOrder: item.sortOrder,
        isPublished: item.isPublished,
        hideAddonDetails: item.hideAddonDetails,
        customPriceJpy: item.customPriceJpy ?? null,
        appointmentCount: item._count.appointments,
        category: {
          id: item.category.id.toString(),
          nameZh: item.category.nameZh,
          nameJa: item.category.nameJa
        },
        servicePackage: {
          id: item.servicePackage.id.toString(),
          nameZh: item.servicePackage.nameZh,
          nameJa: item.servicePackage.nameJa,
          priceJpy: item.servicePackage.priceJpy,
          durationMin: item.servicePackage.durationMin,
          isActive: item.servicePackage.isActive
        }
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch showcase items", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = normalizePayload(showcaseSchema.parse(await request.json()));

    const [category, servicePackage] = await Promise.all([
      prisma.serviceCategory.findUnique({ where: { id: payload.categoryId }, select: { id: true } }),
      prisma.servicePackage.findUnique({ where: { id: payload.servicePackageId }, select: { id: true } })
    ]);

    if (!category || !servicePackage) {
      return NextResponse.json({ error: "Category or package not found" }, { status: 404 });
    }

    const created = await prisma.showcaseItem.create({
      data: payload,
      select: { id: true }
    });

    return NextResponse.json({ id: created.id.toString() }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create showcase item", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
