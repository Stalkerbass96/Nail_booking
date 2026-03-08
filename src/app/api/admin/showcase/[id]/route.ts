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
  isPublished: z.boolean()
});

function toBigInt(value: string | number, fieldName: string) {
  try {
    return BigInt(String(value));
  } catch {
    throw new Error(`Invalid ${fieldName}`);
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const showcaseId = toBigInt(id, "showcaseId");
    const payload = showcaseSchema.parse(await request.json());

    const data = {
      categoryId: toBigInt(payload.categoryId, "categoryId"),
      servicePackageId: toBigInt(payload.servicePackageId, "servicePackageId"),
      titleZh: payload.titleZh.trim(),
      titleJa: payload.titleJa.trim(),
      descriptionZh: payload.descriptionZh?.trim() || null,
      descriptionJa: payload.descriptionJa?.trim() || null,
      imageUrl: payload.imageUrl.trim(),
      sortOrder: payload.sortOrder,
      isPublished: payload.isPublished
    };

    const updated = await prisma.showcaseItem.update({
      where: { id: showcaseId },
      data,
      select: { id: true }
    });

    return NextResponse.json({ id: updated.id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
    }

    if (error instanceof Error && error.message.startsWith("Invalid ")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update showcase item", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
