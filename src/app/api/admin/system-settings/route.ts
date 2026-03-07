import { prisma } from "@/lib/db";
import { DEFAULT_RUNTIME_SETTINGS, SETTING_KEYS, parseRuntimeSettingsSnapshot } from "@/lib/system-settings";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const slotMinutesSchema = z
  .number()
  .int()
  .min(30)
  .max(120)
  .refine((value) => value % 30 === 0, {
    message: "slotMinutes must be a multiple of 30"
  });

const updateSchema = z
  .object({
    slotMinutes: slotMinutesSchema.optional(),
    pendingAutoCancelHours: z.number().int().min(1).max(168).optional(),
    cancelCutoffHours: z.number().int().min(0).max(168).optional(),
    pointEarnRatioJpy: z.number().int().min(1).max(100000).optional(),
    pointRedeemRatioJpy: z.number().int().min(1).max(100000).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field is required" });

function toResponseShape(snapshot: ReturnType<typeof parseRuntimeSettingsSnapshot>) {
  return {
    slotMinutes: snapshot.slotMinutes,
    pendingAutoCancelHours: snapshot.pendingAutoCancelHours,
    cancelCutoffHours: snapshot.cancelCutoffHours,
    pointEarnRatioJpy: snapshot.pointEarnRatioJpy,
    pointRedeemRatioJpy: snapshot.pointRedeemRatioJpy
  };
}

async function readSettings() {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    select: { key: true, value: true }
  });

  return parseRuntimeSettingsSnapshot(settings);
}

export async function GET() {
  try {
    const snapshot = await readSettings();
    return NextResponse.json({
      settings: toResponseShape(snapshot),
      defaults: {
        slotMinutes: DEFAULT_RUNTIME_SETTINGS.slotMinutes,
        pendingAutoCancelHours: DEFAULT_RUNTIME_SETTINGS.pendingAutoCancelHours,
        cancelCutoffHours: DEFAULT_RUNTIME_SETTINGS.cancelCutoffHours,
        pointEarnRatioJpy: DEFAULT_RUNTIME_SETTINGS.pointEarnRatioJpy,
        pointRedeemRatioJpy: DEFAULT_RUNTIME_SETTINGS.pointRedeemRatioJpy
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch system settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = updateSchema.parse(await request.json());

    const updates: Array<{ key: string; value: string }> = [];
    if (payload.slotMinutes !== undefined) updates.push({ key: "slot_minutes", value: String(payload.slotMinutes) });
    if (payload.pendingAutoCancelHours !== undefined) {
      updates.push({ key: "pending_auto_cancel_hours", value: String(payload.pendingAutoCancelHours) });
    }
    if (payload.cancelCutoffHours !== undefined) {
      updates.push({ key: "cancel_cutoff_hours", value: String(payload.cancelCutoffHours) });
    }
    if (payload.pointEarnRatioJpy !== undefined) {
      updates.push({ key: "point_earn_ratio_jpy", value: String(payload.pointEarnRatioJpy) });
    }
    if (payload.pointRedeemRatioJpy !== undefined) {
      updates.push({ key: "point_redeem_ratio_jpy", value: String(payload.pointRedeemRatioJpy) });
    }

    await prisma.$transaction(
      updates.map((item) =>
        prisma.systemSetting.upsert({
          where: { key: item.key },
          create: item,
          update: { value: item.value }
        })
      )
    );

    const snapshot = await readSettings();
    return NextResponse.json({ settings: toResponseShape(snapshot) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update system settings",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}