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

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const categoryId = parseSingleBigInt(id, "categoryId");

    const summary = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        _count: {
          select: {
            packages: true,
            showcaseItems: true
          }
        }
      }
    });

    if (!summary) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (summary._count.packages > 0 || summary._count.showcaseItems > 0) {
      return NextResponse.json(
        { error: "Cannot delete category that is used by packages or showcase items" },
        { status: 409 }
      );
    }

    await prisma.serviceCategory.delete({ where: { id: categoryId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete category", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
