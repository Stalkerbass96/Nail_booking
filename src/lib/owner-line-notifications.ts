import { LineMessageDirection, LineMessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatDateTimeInOffset } from "@/lib/booking-rules";
import { buildAppUrl, pushLineTextMessage } from "@/lib/line";

type Tx = Prisma.TransactionClient | typeof prisma;

export const OWNER_LINE_USER_SETTING_KEY = "owner_notification_line_user_id";

export async function getOwnerNotificationLineUserId(tx: Tx): Promise<bigint | null> {
  const setting = await tx.systemSetting.findUnique({
    where: { key: OWNER_LINE_USER_SETTING_KEY },
    select: { value: true }
  });
  if (!setting?.value) return null;
  try {
    return BigInt(setting.value);
  } catch {
    return null;
  }
}

async function recordOwnerMessage(tx: Tx, input: {
  lineUserId: bigint;
  text: string;
  status: LineMessageStatus;
  messageType: string;
}) {
  await tx.lineMessage.create({
    data: {
      lineUserId: input.lineUserId,
      direction: LineMessageDirection.outgoing,
      status: input.status,
      messageType: input.messageType,
      text: input.text,
      readAt: new Date()
    }
  });
}

async function sendAndRecord(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  text: string;
  messageType: string;
}) {
  try {
    await pushLineTextMessage(input.linePlatformUserId, input.text);
    await recordOwnerMessage(tx, {
      lineUserId: input.lineUserDbId,
      text: input.text,
      messageType: input.messageType,
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordOwnerMessage(tx, {
      lineUserId: input.lineUserDbId,
      text: input.text,
      messageType: input.messageType,
      status: LineMessageStatus.failed
    }).catch(() => undefined);
    return false;
  }
}

export async function sendOwnerBookingAlert(tx: Tx, bookingNo: string) {
  const ownerLineUserId = await getOwnerNotificationLineUserId(tx);
  if (!ownerLineUserId) return false;

  const [owner, appointment] = await Promise.all([
    tx.lineUser.findFirst({
      where: { id: ownerLineUserId, isFollowing: true },
      select: { id: true, lineUserId: true }
    }),
    tx.appointment.findUnique({
      where: { bookingNo },
      include: {
        customer: { select: { name: true } },
        servicePackage: { select: { nameJa: true, nameZh: true } },
        showcaseItem: { select: { titleJa: true, titleZh: true } },
        addons: {
          include: { addon: { select: { nameJa: true, nameZh: true } } }
        }
      }
    })
  ]);
  if (!owner || !appointment) return false;

  const addonText = appointment.addons.length
    ? appointment.addons.map((item) => `${item.addon.nameJa || item.addon.nameZh} x${item.qty}`).join(", ")
    : "なし";
  const adminUrl = buildAppUrl("/admin/appointments");
  const text = [
    "【新しい予約 / 新预约】",
    `予約番号: ${appointment.bookingNo}`,
    `お客様: ${appointment.customer.name}`,
    `日時: ${formatDateTimeInOffset(appointment.startAt, "ja-JP")}`,
    `メニュー: ${appointment.servicePackage.nameJa || appointment.servicePackage.nameZh}`,
    appointment.showcaseItem ? `デザイン: ${appointment.showcaseItem.titleJa || appointment.showcaseItem.titleZh}` : null,
    `オプション: ${addonText}`,
    appointment.customerNote ? `メモ: ${appointment.customerNote}` : null,
    adminUrl ? `管理画面: ${adminUrl}` : null
  ].filter(Boolean).join("\n");

  return sendAndRecord(tx, {
    lineUserDbId: owner.id,
    linePlatformUserId: owner.lineUserId,
    text,
    messageType: "owner_booking_alert"
  });
}

export async function sendOwnerNotificationTest(tx: Tx, lineUserDbId: bigint) {
  const owner = await tx.lineUser.findFirst({
    where: { id: lineUserDbId, isFollowing: true },
    select: { id: true, lineUserId: true }
  });
  if (!owner) return false;
  return sendAndRecord(tx, {
    lineUserDbId: owner.id,
    linePlatformUserId: owner.lineUserId,
    text: "【通知テスト】\n新しい予約通知の受信設定が完了しました。",
    messageType: "owner_notification_test"
  });
}
