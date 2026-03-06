import { parseSingleBigInt } from "@/lib/booking-rules";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateCategorySchema = z.object({
  nameZh: z.string().trim().min(1).max(80).optional(),
  nameJa: z.string().trim().min(1).max(80).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional()
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const categoryId = parseSingleBigInt(id, "categoryId");
    const payload = updateCategorySchema.parse(await request.json());

    const exists = await prisma.serviceCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!exists) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.serviceCategory.update({
      where: { id: categoryId },
      data: payload
    });

    return NextResponse.json({
      id: updated.id.toString(),
      nameZh: updated.nameZh,
      nameJa: updated.nameJa,
      sortOrder: updated.sortOrder,
      isActive: updated.isActive
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update category", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}