import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";

    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        packages: {
          where: { isActive: true },
          select: { id: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
    });

    return NextResponse.json({
      items: categories.map((item) => ({
        id: item.id.toString(),
        name: lang === "ja" ? item.nameJa : item.nameZh,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        sortOrder: item.sortOrder,
        packageCount: item.packages.length
      }))
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch categories",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}