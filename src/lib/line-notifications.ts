import { LineMessageDirection, LineMessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Lang } from "@/lib/lang";
import { formatDateTimeInOffset } from "@/lib/booking-rules";
import { buildLineHomeUrl, buildPublicBookingDetailUrl, pushLineTextMessage } from "@/lib/line";
import { LINE_MSG_KEYS, LINE_MSG_DEFAULTS, parseMsgSettings, type LineMsgSettings } from "@/lib/line-message-settings";

type Tx = Prisma.TransactionClient | typeof prisma;

function bookingLabel() {
  return "予約番号";
}

function detailLabel() {
  return "予約詳細";
}

function newTimeLabel() {
  return "新しい日時";
}

async function loadMessages(tx: Tx): Promise<LineMsgSettings> {
  const rows = await tx.systemSetting.findMany({
    where: { key: { in: [...LINE_MSG_KEYS] } },
    select: { key: true, value: true }
  });
  return parseMsgSettings(rows);
}

async function recordLineMessage(tx: Tx, input: {
  lineUserId: bigint;
  text: string;
  messageType: string;
  status: LineMessageStatus;
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

export async function sendWelcomeHomeLink(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  entryToken: string;
}) {
  const homeUrl = buildLineHomeUrl(input.entryToken, "ja");
  if (!homeUrl) return false;

  const messages = await loadMessages(tx);
  const text = `${messages.line_msg_welcome_1}\n${messages.line_msg_welcome_2}\n${homeUrl}`;

  try {
    await pushLineTextMessage(input.linePlatformUserId, text);
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "welcome_home",
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "welcome_home",
      status: LineMessageStatus.failed
    });
    return false;
  }
}

export async function sendGalleryHomeLink(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  entryToken: string;
  lang: Lang;
}) {
  const homeUrl = buildLineHomeUrl(input.entryToken, "ja");
  if (!homeUrl) return false;

  const messages = await loadMessages(tx);
  const text = `${messages.line_msg_gallery_1}\n${homeUrl}\n\n${messages.line_msg_gallery_2}`;

  try {
    await pushLineTextMessage(input.linePlatformUserId, text);
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "gallery_home",
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "gallery_home",
      status: LineMessageStatus.failed
    });
    return false;
  }
}

export async function sendPendingBookingMessage(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  bookingNo: string;
  entryToken?: string | null;
  lang: Lang;
}) {
  const messages = await loadMessages(tx);
  const detailUrl = buildPublicBookingDetailUrl(input.bookingNo, input.entryToken ?? undefined, "ja");
  const text = [
    messages.line_msg_pending,
    `${bookingLabel()}: ${input.bookingNo}`,
    detailUrl ? `${detailLabel()}: ${detailUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await pushLineTextMessage(input.linePlatformUserId, text);
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_pending",
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_pending",
      status: LineMessageStatus.failed
    });
    return false;
  }
}

export async function sendRescheduledBookingMessage(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  bookingNo: string;
  newStartAt: Date;
  entryToken?: string | null;
  lang: Lang;
}) {
  const messages = await loadMessages(tx);
  const formattedTime = formatDateTimeInOffset(input.newStartAt, "ja-JP");
  const detailUrl = buildPublicBookingDetailUrl(input.bookingNo, input.entryToken ?? undefined, "ja");
  const text = [
    messages.line_msg_rescheduled,
    `${newTimeLabel()}: ${formattedTime}`,
    `${bookingLabel()}: ${input.bookingNo}`,
    detailUrl ? `${detailLabel()}: ${detailUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await pushLineTextMessage(input.linePlatformUserId, text);
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_rescheduled",
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_rescheduled",
      status: LineMessageStatus.failed
    });
    return false;
  }
}

export async function sendConfirmedBookingMessage(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  bookingNo: string;
  entryToken?: string | null;
  lang: Lang;
}) {
  const messages = await loadMessages(tx);
  const detailUrl = buildPublicBookingDetailUrl(input.bookingNo, input.entryToken ?? undefined, "ja");
  const text = [
    messages.line_msg_confirmed,
    `${bookingLabel()}: ${input.bookingNo}`,
    detailUrl ? `${detailLabel()}: ${detailUrl}` : null
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await pushLineTextMessage(input.linePlatformUserId, text);
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_confirmed",
      status: LineMessageStatus.sent
    });
    return true;
  } catch {
    await recordLineMessage(tx, {
      lineUserId: input.lineUserDbId,
      text,
      messageType: "booking_confirmed",
      status: LineMessageStatus.failed
    });
    return false;
  }
}

// Re-export defaults so callers can show placeholder text in the admin UI.
export { LINE_MSG_DEFAULTS };
