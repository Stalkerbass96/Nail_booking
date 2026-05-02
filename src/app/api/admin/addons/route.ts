import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

type AddonWithLinks = {
  id: bigint;
  nameZh: string;
  nameJa: string;
  descZh: string | null;
  descJa: string | null;
  priceJpy: number;
  durationIncreaseMin: number;
  maxQty: number;
  isActive: boolean;
  packageLinks: Array<{ packageId: bigint }>;
};

const createAddonSchema = z.object({
  nameZh: z.string().trim().min(1).max(120),
  nameJa: z.string().trim().min(1).max(120),
  descZh: z.string().trim().max(5000).optional().nullable(),
  descJa: z.string().trim().max(5000).optional().nullable(),
  priceJpy: z.number().int().min(0),
  durationIncreaseMin: z.number().int().min(0),
  maxQty: z.number().int().min(1).max(99).optional().default(1),
  isActive: z.boolean().optional().default(true)
});

function ensureDuration(minutes: number) {
  if (minutes % 5 !== 0) {
    throw new Error("Invalid durationIncreaseMin: must be a multiple of 5");
  }
}

export async function GET(request: NextRequest) {
  try {
    const lang = request.nextUrl.searchParams.get("lang") === "ja" ? "ja" : "zh";

    const items: AddonWithLinks[] = await prisma.serviceAddon.findMany({
      include: {
        packageLinks: {
          select: { packageId: true }
        }
      },
      orderBy: [{ isActive: "desc" }, { id: "asc" }]
    });

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id.toString(),
        name: lang === "ja" ? item.nameJa : item.nameZh,
        nameZh: item.nameZh,
        nameJa: item.nameJa,
        descZh: item.descZh,
        descJa: item.descJa,
        priceJpy: item.priceJpy,
        durationIncreaseMin: item.durationIncreaseMin,
        maxQty: item.maxQty,
        isActive: item.isActive,
        packageIds: item.packageLinks.map((link) => link.packageId.toString())
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch addons", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = createAddonSchema.parse(await request.json());
    ensureDuration(payload.durationIncreaseMin);

    const created = await prisma.serviceAddon.create({
      data: {
        nameZh: payload.nameZh,
        nameJa: payload.nameJa,
        descZh: payload.descZh ?? null,
        descJa: payload.descJa ?? null,
        priceJpy: payload.priceJpy,
        durationIncreaseMin: payload.durationIncreaseMin,
        maxQty: payload.maxQty,
        isActive: payload.isActive
      }
    });

    return NextResponse.json({ id: created.id.toString() }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("multiple of 30")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create addon", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
