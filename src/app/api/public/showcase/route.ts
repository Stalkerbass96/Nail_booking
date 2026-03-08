import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";
    const categoryIdRaw = request.nextUrl.searchParams.get("categoryId") ?? "";
    const categoryId = categoryIdRaw ? BigInt(categoryIdRaw) : null;

    const items = await prisma.showcaseItem.findMany({
      where: {
        isPublished: true,
        ...(categoryId ? { categoryId } : {})
      },
      include: {
        category: {
          select: { id: true, nameZh: true, nameJa: true }
        },
        servicePackage: {
          select: { id: true, nameZh: true, nameJa: true, priceJpy: true, durationMin: true, isActive: true }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return NextResponse.json({
      items: items
        .filter((item) => item.servicePackage.isActive)
        .map((item) => ({
          id: item.id.toString(),
          title: lang === "ja" ? item.titleJa : item.titleZh,
          titleZh: item.titleZh,
          titleJa: item.titleJa,
          description: lang === "ja" ? item.descriptionJa : item.descriptionZh,
          descriptionZh: item.descriptionZh,
          descriptionJa: item.descriptionJa,
          imageUrl: item.imageUrl,
          priceJpy: item.servicePackage.priceJpy,
          durationMin: item.servicePackage.durationMin,
          category: {
            id: item.category.id.toString(),
            name: lang === "ja" ? item.category.nameJa : item.category.nameZh,
            nameZh: item.category.nameZh,
            nameJa: item.category.nameJa
          },
          servicePackage: {
            id: item.servicePackage.id.toString(),
            name: lang === "ja" ? item.servicePackage.nameJa : item.servicePackage.nameZh,
            nameZh: item.servicePackage.nameZh,
            nameJa: item.servicePackage.nameJa
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
