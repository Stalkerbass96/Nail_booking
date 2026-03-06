import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";
    const { id } = await context.params;
    const packageId = parseSingleBigInt(id, "packageId");

    const servicePackage = await prisma.servicePackage.findFirst({
      where: {
        id: packageId,
        isActive: true
      },
      include: {
        category: {
          select: {
            id: true,
            nameZh: true,
            nameJa: true
          }
        },
        addonLinks: {
          include: {
            addon: {
              select: {
                id: true,
                isActive: true,
                nameZh: true,
                nameJa: true,
                descZh: true,
                descJa: true,
                priceJpy: true,
                durationIncreaseMin: true
              }
            }
          }
        }
      }
    });

    if (!servicePackage) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const addons = servicePackage.addonLinks
      .filter((item) => item.addon.isActive)
      .map((item) => ({
        id: item.addon.id.toString(),
        name: lang === "ja" ? item.addon.nameJa : item.addon.nameZh,
        nameZh: item.addon.nameZh,
        nameJa: item.addon.nameJa,
        description: lang === "ja" ? item.addon.descJa : item.addon.descZh,
        priceJpy: item.addon.priceJpy,
        durationIncreaseMin: item.addon.durationIncreaseMin
      }));

    return NextResponse.json({
      id: servicePackage.id.toString(),
      name: lang === "ja" ? servicePackage.nameJa : servicePackage.nameZh,
      nameZh: servicePackage.nameZh,
      nameJa: servicePackage.nameJa,
      description: lang === "ja" ? servicePackage.descJa : servicePackage.descZh,
      descriptionZh: servicePackage.descZh,
      descriptionJa: servicePackage.descJa,
      imageUrl: servicePackage.imageUrl,
      priceJpy: servicePackage.priceJpy,
      durationMin: servicePackage.durationMin,
      category: {
        id: servicePackage.category.id.toString(),
        name: lang === "ja" ? servicePackage.category.nameJa : servicePackage.category.nameZh,
        nameZh: servicePackage.category.nameZh,
        nameJa: servicePackage.category.nameJa
      },
      addons
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error: "Failed to fetch package detail",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}