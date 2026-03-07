const { createHash } = require("node:crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SYSTEM_SETTINGS = [
  ["slot_minutes", "30"],
  ["pending_auto_cancel_hours", "24"],
  ["cancel_cutoff_hours", "6"],
  ["point_earn_ratio_jpy", "100"],
  ["point_redeem_ratio_jpy", "100"]
];

function hashPassword(password) {
  return `sha256:${createHash("sha256").update(password).digest("hex")}`;
}

function fixedTime(hour, minute = 0) {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

async function seedSystemSettings() {
  for (const [key, value] of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value }
    });
  }
}

async function seedAdmin() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD || "dev-only-change-me";
  const passwordHash = hashPassword(seedPassword);

  await prisma.admin.upsert({
    where: { email: "owner@nail-booking.local" },
    create: {
      email: "owner@nail-booking.local",
      passwordHash,
      displayName: "店长"
    },
    update: {
      passwordHash,
      displayName: "店长"
    }
  });
}

async function seedBusinessHours() {
  const count = await prisma.businessHour.count();
  if (count > 0) return;

  await prisma.businessHour.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      isOpen: true,
      openTime: fixedTime(10, 0),
      closeTime: fixedTime(20, 0)
    }))
  });
}

async function seedCatalog() {
  const categoryCount = await prisma.serviceCategory.count();
  if (categoryCount === 0) {
    await prisma.serviceCategory.createMany({
      data: [
        { nameZh: "基础护理", nameJa: "ベーシック", sortOrder: 10, isActive: true },
        { nameZh: "长款设计", nameJa: "ロングデザイン", sortOrder: 20, isActive: true },
        { nameZh: "修护护理", nameJa: "ケア", sortOrder: 30, isActive: true }
      ]
    });
  }

  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
  if (categories.length === 0) {
    throw new Error("No service categories found after seed");
  }

  const packageCount = await prisma.servicePackage.count();
  if (packageCount === 0) {
    const first = categories[0];
    const second = categories[1] ?? categories[0];
    const third = categories[2] ?? categories[0];

    await prisma.servicePackage.createMany({
      data: [
        {
          categoryId: first.id,
          nameZh: "基础单色",
          nameJa: "ワンカラー",
          descZh: "适合日常通勤的基础护理与单色上甲。",
          descJa: "通勤にも使いやすいベーシックケア付きワンカラーです。",
          imageUrl: null,
          priceJpy: 5800,
          durationMin: 60,
          isActive: true
        },
        {
          categoryId: second.id,
          nameZh: "长款设计款",
          nameJa: "ロングデザイン",
          descZh: "适合偏设计感、需要更完整造型的客人。",
          descJa: "しっかりデザインを入れたい方向けのロングメニューです。",
          imageUrl: null,
          priceJpy: 9800,
          durationMin: 120,
          isActive: true
        },
        {
          categoryId: third.id,
          nameZh: "手部修护护理",
          nameJa: "ハンドディープケア",
          descZh: "包含基础修护与手部保养，适合护理型预约。",
          descJa: "ベーシックケアと保湿トリートメントを含むケアメニューです。",
          imageUrl: null,
          priceJpy: 4500,
          durationMin: 60,
          isActive: true
        }
      ]
    });
  }

  const addonCount = await prisma.serviceAddon.count();
  if (addonCount === 0) {
    await prisma.serviceAddon.createMany({
      data: [
        {
          nameZh: "卸甲",
          nameJa: "オフ",
          descZh: "旧甲卸除",
          descJa: "付け替えオフ",
          priceJpy: 1000,
          durationIncreaseMin: 30,
          isActive: true
        },
        {
          nameZh: "跳色",
          nameJa: "カラー追加",
          descZh: "增加颜色变化",
          descJa: "色替え・差し色追加",
          priceJpy: 800,
          durationIncreaseMin: 30,
          isActive: true
        }
      ]
    });
  }

  const linkCount = await prisma.packageAddonLink.count();
  if (linkCount === 0) {
    const packages = await prisma.servicePackage.findMany({ select: { id: true } });
    const addons = await prisma.serviceAddon.findMany({ select: { id: true } });

    const linkData = [];
    for (const pkg of packages) {
      for (const addon of addons) {
        linkData.push({ packageId: pkg.id, addonId: addon.id });
      }
    }

    if (linkData.length > 0) {
      await prisma.packageAddonLink.createMany({ data: linkData });
    }
  }
}

async function main() {
  await seedSystemSettings();
  await seedAdmin();
  await seedBusinessHours();
  await seedCatalog();

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
