import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";
    const categoryIdRaw = request.nextUrl.searchParams.get("categoryId");

    const categoryId = categoryIdRaw ? parseSingleBigInt(categoryIdRaw, "categoryId") : undefined;

    const packages = await prisma.servicePackage.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {})
      },
      include: {
        category: {
          select: {
            id: true,
            nameZh: true,
            nameJa: true
          }
        }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { id: "asc" }]
    });

    return NextResponse.json({
      items: packages.map((item) => ({
        id: item.id.toString(),
        name: lang === "ja" ? item.nameJa : item.nameZh,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        description: lang === "ja" ? item.descJa : item.descZh,
        descriptionZh: item.descZh,
        descriptionJa: item.descJa,
        imageUrl: item.imageUrl,
        priceJpy: item.priceJpy,
        durationMin: item.durationMin,
        category: {
          id: item.category.id.toString(),
          name: lang === "ja" ? item.category.nameJa : item.category.nameZh,
          nameZh: item.category.nameZh,
          nameJa: item.category.nameJa
        }
      }))
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch packages",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}