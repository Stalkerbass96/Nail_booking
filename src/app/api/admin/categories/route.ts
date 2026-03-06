import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createCategorySchema = z.object({
  nameZh: z.string().trim().min(1).max(80),
  nameJa: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";

    const items = await prisma.serviceCategory.findMany({
      include: {
        packages: {
          select: { id: true, isActive: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        name: lang === "ja" ? item.nameJa : item.nameZh,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        packageCount: item.packages.length,
        activePackageCount: item.packages.filter((pkg) => pkg.isActive).length
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createCategorySchema.parse(await request.json());

    const created = await prisma.serviceCategory.create({
      data: {
        nameZh: payload.nameZh,
        nameJa: payload.nameJa,
        sortOrder: payload.sortOrder,
        isActive: payload.isActive
      }
    });

    return NextResponse.json(
      {
        id: created.id.toString(),
        nameZh: created.nameZh,
        nameJa: created.nameJa,
        sortOrder: created.sortOrder,
        isActive: created.isActive
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}