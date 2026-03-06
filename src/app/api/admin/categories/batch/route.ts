import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const batchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("setActive"),
    ids: z.array(z.union([z.string(), z.number().int().positive()])).min(1),
    isActive: z.boolean()
  }),
  z.object({
    action: z.literal("setSortOrder"),
    items: z.array(
      z.object({
        id: z.union([z.string(), z.number().int().positive()]),
        sortOrder: z.number().int()
      })
    ).min(1)
  })
]);

export async function POST(request: NextRequest) {
  try {
    const payload = batchSchema.parse(await request.json());

    if (payload.action === "setActive") {
      const ids = Array.from(new Set(payload.ids.map((id) => parseSingleBigInt(String(id), "categoryId"))));
      const result = await prisma.serviceCategory.updateMany({
        where: { id: { in: ids } },
        data: { isActive: payload.isActive }
      });

      return NextResponse.json({ ok: true, affected: result.count });
    }

    const updates = payload.items.map((item) => ({
      id: parseSingleBigInt(String(item.id), "categoryId"),
      sortOrder: item.sortOrder
    }));

    await prisma.$transaction(
      updates.map((item) =>
        prisma.serviceCategory.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder }
        })
      )
    );

    return NextResponse.json({ ok: true, affected: updates.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to apply category batch operation", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}