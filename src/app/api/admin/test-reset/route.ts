import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const prisma = new PrismaClient();
const REQUIRED_CONFIRMATION = "RESET";

const resetSchema = z.object({
  confirmation: z.string().trim()
});

function fixedTime(hour: number, minute = 0) {
  return new Date(Date.UTC(1970, 0, 1, hour, minute, 0, 0));
}

async function seedBusinessHoursIfEmpty() {
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
  await prisma.serviceCategory.createMany({
    data: [
      { nameZh: "基础护理", nameJa: "ベーシック", sortOrder: 10, isActive: true },
      { nameZh: "长款设计", nameJa: "ロングデザイン", sortOrder: 20, isActive: true },
      { nameZh: "修护护理", nameJa: "ケア", sortOrder: 30, isActive: true }
    ]
  });

  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
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

  const freshPackages = await prisma.servicePackage.findMany({ orderBy: { id: "asc" } });

  await prisma.showcaseItem.createMany({
    data: [
      {
        categoryId: categories[0].id,
        servicePackageId: freshPackages[0].id,
        titleZh: "透肌单色光泽",
        titleJa: "シアーワンカラーツヤ",
        descriptionZh: "适合日常通勤的干净质感，基础但不平淡。",
        descriptionJa: "通勤にも合うクリーンな質感。ベーシックでも物足りなくない一本です。",
        imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 10,
        isPublished: true
      },
      {
        categoryId: second.id,
        servicePackageId: freshPackages[1] ? freshPackages[1].id : freshPackages[0].id,
        titleZh: "金属镜面长甲",
        titleJa: "メタリックミラーロング",
        descriptionZh: "适合想要更强存在感的拍照款，造型轮廓更完整。",
        descriptionJa: "写真映えする存在感のあるデザイン。フォルムもしっかり見せたい方向けです。",
        imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 20,
        isPublished: true
      },
      {
        categoryId: third.id,
        servicePackageId: freshPackages[2] ? freshPackages[2].id : freshPackages[0].id,
        titleZh: "柔润手部深护",
        titleJa: "やわらかハンドディープケア",
        descriptionZh: "适合想先把手部状态调整好的护理型客人。",
        descriptionJa: "手元の状態を整えたい方に向けたケア中心のメニューです。",
        imageUrl: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=1200&q=80",
        sortOrder: 30,
        isPublished: true
      }
    ]
  });
}

export async function POST(request: NextRequest) {
  try {
    const payload = resetSchema.parse(await request.json());
    if (payload.confirmation !== REQUIRED_CONFIRMATION) {
      return NextResponse.json({ error: "Invalid confirmation phrase" }, { status: 400 });
    }

    const counts = await prisma.$transaction(async (tx) => {
      const pointLedgers = await tx.pointLedger.deleteMany();
      const appointmentAddons = await tx.appointmentAddon.deleteMany();
      const appointments = await tx.appointment.deleteMany();
      const lineLinkSessions = await tx.lineLinkSession.deleteMany();
      const lineLinkTokens = await tx.lineLinkToken.deleteMany();
      const lineMessages = await tx.lineMessage.deleteMany();
      const lineUsers = await tx.lineUser.deleteMany();
      const customers = await tx.customer.deleteMany();
      const bookingBlocks = await tx.bookingBlock.deleteMany();
      const specialBusinessDates = await tx.specialBusinessDate.deleteMany();
      const showcaseItems = await tx.showcaseItem.deleteMany();
      const packageAddonLinks = await tx.packageAddonLink.deleteMany();
      const servicePackages = await tx.servicePackage.deleteMany();
      const serviceAddons = await tx.serviceAddon.deleteMany();
      const serviceCategories = await tx.serviceCategory.deleteMany();

      return {
        pointLedgers: pointLedgers.count,
        appointmentAddons: appointmentAddons.count,
        appointments: appointments.count,
        lineLinkSessions: lineLinkSessions.count,
        lineLinkTokens: lineLinkTokens.count,
        lineMessages: lineMessages.count,
        lineUsers: lineUsers.count,
        customers: customers.count,
        bookingBlocks: bookingBlocks.count,
        specialBusinessDates: specialBusinessDates.count,
        showcaseItems: showcaseItems.count,
        packageAddonLinks: packageAddonLinks.count,
        servicePackages: servicePackages.count,
        serviceAddons: serviceAddons.count,
        serviceCategories: serviceCategories.count
      };
    });

    await seedBusinessHoursIfEmpty();
    await seedCatalog();

    return NextResponse.json({
      ok: true,
      message: "Test data cleared and sample catalog restored",
      summary: {
        ...counts,
        preserved: {
          admins: await prisma.admin.count(),
          systemSettings: await prisma.systemSetting.count(),
          businessHours: await prisma.businessHour.count()
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to reset test data", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
