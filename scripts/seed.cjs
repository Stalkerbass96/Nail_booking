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
      displayName: "\u5e97\u957f"
    },
    update: {
      passwordHash,
      displayName: "\u5e97\u957f"
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
        { nameZh: "\u57fa\u7840\u62a4\u7406", nameJa: "\u30d9\u30fc\u30b7\u30c3\u30af", sortOrder: 10, isActive: true },
        { nameZh: "\u957f\u6b3e\u8bbe\u8ba1", nameJa: "\u30ed\u30f3\u30b0\u30c7\u30b6\u30a4\u30f3", sortOrder: 20, isActive: true },
        { nameZh: "\u4fee\u62a4\u62a4\u7406", nameJa: "\u30b1\u30a2", sortOrder: 30, isActive: true }
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
          nameZh: "\u57fa\u7840\u5355\u8272",
          nameJa: "\u30ef\u30f3\u30ab\u30e9\u30fc",
          descZh: "\u9002\u5408\u65e5\u5e38\u901a\u52e4\u7684\u57fa\u7840\u62a4\u7406\u4e0e\u5355\u8272\u4e0a\u7532\u3002",
          descJa: "\u901a\u52e4\u306b\u3082\u4f7f\u3044\u3084\u3059\u3044\u30d9\u30fc\u30b7\u30c3\u30af\u30b1\u30a2\u4ed8\u304d\u30ef\u30f3\u30ab\u30e9\u30fc\u3067\u3059\u3002",
          imageUrl: null,
          priceJpy: 5800,
          durationMin: 60,
          isActive: true
        },
        {
          categoryId: second.id,
          nameZh: "\u957f\u6b3e\u8bbe\u8ba1\u6b3e",
          nameJa: "\u30ed\u30f3\u30b0\u30c7\u30b6\u30a4\u30f3",
          descZh: "\u9002\u5408\u504f\u8bbe\u8ba1\u611f\u3001\u9700\u8981\u66f4\u5b8c\u6574\u9020\u578b\u7684\u5ba2\u4eba\u3002",
          descJa: "\u3057\u3063\u304b\u308a\u30c7\u30b6\u30a4\u30f3\u3092\u5165\u308c\u305f\u3044\u65b9\u5411\u3051\u306e\u30ed\u30f3\u30b0\u30e1\u30cb\u30e5\u30fc\u3067\u3059\u3002",
          imageUrl: null,
          priceJpy: 9800,
          durationMin: 120,
          isActive: true
        },
        {
          categoryId: third.id,
          nameZh: "\u624b\u90e8\u4fee\u62a4\u62a4\u7406",
          nameJa: "\u30cf\u30f3\u30c9\u30c7\u30a3\u30fc\u30d7\u30b1\u30a2",
          descZh: "\u5305\u542b\u57fa\u7840\u4fee\u62a4\u4e0e\u624b\u90e8\u4fdd\u517b\uff0c\u9002\u5408\u62a4\u7406\u578b\u9884\u7ea6\u3002",
          descJa: "\u30d9\u30fc\u30b7\u30c3\u30af\u30b1\u30a2\u3068\u4fdd\u6e7f\u30c8\u30ea\u30fc\u30c8\u30e1\u30f3\u30c8\u3092\u542b\u3080\u30b1\u30a2\u30e1\u30cb\u30e5\u30fc\u3067\u3059\u3002",
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
          nameZh: "\u5378\u7532",
          nameJa: "\u30aa\u30d5",
          descZh: "\u65e7\u7532\u5378\u9664",
          descJa: "\u4ed8\u3051\u66ff\u3048\u30aa\u30d5",
          priceJpy: 1000,
          durationIncreaseMin: 30,
          isActive: true
        },
        {
          nameZh: "\u8df3\u8272",
          nameJa: "\u30ab\u30e9\u30fc\u8ffd\u52a0",
          descZh: "\u589e\u52a0\u989c\u8272\u53d8\u5316",
          descJa: "\u8272\u66ff\u3048\u30fb\u5dee\u3057\u8272\u8ffd\u52a0",
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

async function seedShowcase() {
  const count = await prisma.showcaseItem.count();
  if (count > 0) return;

  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
  const packages = await prisma.servicePackage.findMany({ orderBy: { id: "asc" } });
  if (categories.length === 0 || packages.length === 0) {
    throw new Error("Catalog must exist before showcase seed");
  }

  const first = packages[0];
  const second = packages[1] ?? packages[0];
  const third = packages[2] ?? packages[0];

  await prisma.showcaseItem.createMany({
    data: [
      {
        categoryId: categories[0].id,
        servicePackageId: first.id,
        titleZh: "\u900f\u808c\u5355\u8272\u5149\u6cfd",
        titleJa: "\u30b7\u30a2\u30fc\u30ef\u30f3\u30ab\u30e9\u30fc\u30c4\u30e4",
        descriptionZh: "\u9002\u5408\u65e5\u5e38\u901a\u52e4\u7684\u5e72\u51c0\u8d28\u611f\uff0c\u57fa\u7840\u4f46\u4e0d\u5e73\u6de1\u3002",
        descriptionJa: "\u901a\u52e4\u306b\u3082\u5408\u3046\u30af\u30ea\u30fc\u30f3\u306a\u8cea\u611f\u3002\u30d9\u30fc\u30b7\u30c3\u30af\u3067\u3082\u7269\u8db3\u308a\u3057\u306a\u3044\u4e00\u672c\u3067\u3059\u3002",
        imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 10,
        isPublished: true
      },
      {
        categoryId: (categories[1] ?? categories[0]).id,
        servicePackageId: second.id,
        titleZh: "\u91d1\u5c5e\u955c\u9762\u957f\u7532",
        titleJa: "\u30e1\u30bf\u30ea\u30c3\u30af\u30df\u30e9\u30fc\u30ed\u30f3\u30b0",
        descriptionZh: "\u9002\u5408\u60f3\u8981\u66f4\u5f3a\u5b58\u5728\u611f\u7684\u62cd\u7167\u6b3e\uff0c\u9020\u578b\u8f6e\u5ed3\u66f4\u5b8c\u6574\u3002",
        descriptionJa: "\u5199\u771f\u6620\u3048\u3059\u308b\u5b58\u5728\u611f\u306e\u3042\u308b\u30c7\u30b6\u30a4\u30f3\u3002\u30d5\u30a9\u30eb\u30e0\u3082\u3057\u3063\u304b\u308a\u898b\u305b\u305f\u3044\u65b9\u5411\u3051\u3067\u3059\u3002",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 20,
        isPublished: true
      },
      {
        categoryId: (categories[2] ?? categories[0]).id,
        servicePackageId: third.id,
        titleZh: "\u67d4\u6da6\u624b\u90e8\u6df1\u62a4",
        titleJa: "\u3084\u308f\u3089\u304b\u30cf\u30f3\u30c9\u30c7\u30a3\u30fc\u30d7\u30b1\u30a2",
        descriptionZh: "\u9002\u5408\u60f3\u5148\u628a\u624b\u90e8\u72b6\u6001\u8c03\u6574\u597d\u7684\u62a4\u7406\u578b\u5ba2\u4eba\u3002",
        descriptionJa: "\u624b\u5143\u306e\u72b6\u614b\u3092\u6574\u3048\u305f\u3044\u65b9\u306b\u5411\u3051\u305f\u30b1\u30a2\u4e2d\u5fc3\u306e\u30e1\u30cb\u30e5\u30fc\u3067\u3059\u3002",
        imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 30,
        isPublished: true
      }
    ]
  });
}

async function main() {
  await seedSystemSettings();
  await seedAdmin();
  await seedBusinessHours();
  await seedCatalog();
  await seedShowcase();

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
