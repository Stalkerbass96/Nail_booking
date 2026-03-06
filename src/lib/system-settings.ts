import { prisma } from "@/lib/db";
import {
  DEFAULT_RUNTIME_SETTINGS,
  SETTING_KEYS,
  type RuntimeSettingsSnapshot,
  parseRuntimeSettingsSnapshot
} from "./system-settings-parser";

export { DEFAULT_RUNTIME_SETTINGS, SETTING_KEYS, parseRuntimeSettingsSnapshot };
export type { RuntimeSettingsSnapshot };

export async function getRuntimeSettingsSnapshot(): Promise<RuntimeSettingsSnapshot> {
  const settings = await prisma.systemSetting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
    select: { key: true, value: true }
  });

  return parseRuntimeSettingsSnapshot(settings);
}
