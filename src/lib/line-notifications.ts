import { LineMessageDirection, LineMessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Lang } from "@/lib/lang";
import { buildLineHomeUrl, buildPublicBookingDetailUrl, pushLineTextMessage } from "@/lib/line";

const TEXT = {
  welcome: {
    zh: [
      "\u5df2\u6dfb\u52a0\u5e97\u94fa LINE\u3002",
      "\u8bf7\u4ece\u56fe\u5899\u9996\u9875\u9009\u62e9\u559c\u6b22\u7684\u6b3e\u5f0f\u540e\u9884\u7ea6\uff1a"
    ],
    ja: [
      "\u30b5\u30ed\u30f3 LINE \u306e\u8ffd\u52a0\u3042\u308a\u304c\u3068\u3046\u3054\u3056\u3044\u307e\u3059\u3002",
      "\u4e88\u7d04\u306f\u30ae\u30e3\u30e9\u30ea\u30fc\u30db\u30fc\u30e0\u304b\u3089\u304a\u597d\u307f\u306e\u30c7\u30b6\u30a4\u30f3\u3092\u9078\u3093\u3067\u9032\u3081\u3066\u304f\u3060\u3055\u3044\u3002"
    ]
  },
  pending: {
    zh: "\u9884\u7ea6\u8bf7\u6c42\u5df2\u6536\u5230\uff0c\u6b63\u5728\u7b49\u5f85\u5e97\u957f\u786e\u8ba4\u3002",
    ja: "\u4e88\u7d04\u30ea\u30af\u30a8\u30b9\u30c8\u3092\u53d7\u3051\u4ed8\u3051\u307e\u3057\u305f\u3002\u5e97\u9577\u78ba\u8a8d\u3092\u304a\u5f85\u3061\u304f\u3060\u3055\u3044\u3002"
  },
  confirmed: {
    zh: "\u4f60\u7684\u9884\u7ea6\u5df2\u786e\u8ba4\u3002\u671f\u5f85\u4f60\u7684\u5230\u6765\u3002",
    ja: "\u3054\u4e88\u7d04\u304c\u78ba\u5b9a\u3057\u307e\u3057\u305f\u3002\u3054\u6765\u5e97\u3092\u304a\u5f85\u3061\u3057\u3066\u3044\u307e\u3059\u3002"
  },
  gallery: {
    zh: [
      "\u8bf7\u70b9\u51fb\u4e0b\u65b9\u94fe\u63a5\u67e5\u770b\u56fe\u5899\u5e76\u9884\u7ea6\uff1a",
      "\u8fdb\u5165\u540e\u53ef\u4ee5\u76f4\u63a5\u9009\u62e9\u540c\u6b3e\u548c\u65f6\u95f4\u3002"
    ],
    ja: [
      "\u4e0b\u306e\u30ea\u30f3\u30af\u304b\u3089\u30ae\u30e3\u30e9\u30ea\u30fc\u3092\u898b\u3066\u3054\u4e88\u7d04\u304f\u3060\u3055\u3044\u3002",
      "\u30c7\u30b6\u30a4\u30f3\u3068\u5e0c\u671b\u6642\u9593\u3092\u305d\u306e\u307e\u307e\u9078\u629e\u3067\u304d\u307e\u3059\u3002"
    ]
  }
} as const;

type Tx = Prisma.TransactionClient | typeof prisma;

function bookingLabel(lang: Lang) {
  return lang === "ja" ? "\u4e88\u7d04\u756a\u53f7" : "\u9884\u7ea6\u53f7";
}

function detailLabel(lang: Lang) {
  return lang === "ja" ? "\u4e88\u7d04\u8a73\u7d30" : "\u9884\u7ea6\u8be6\u60c5";
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
  const homeUrl = buildLineHomeUrl(input.entryToken, "zh");
  if (!homeUrl) return false;

  const text = `${TEXT.welcome.zh[0]}\n${TEXT.welcome.zh[1]}\n${homeUrl}\n\n${TEXT.welcome.ja[0]}\n${TEXT.welcome.ja[1]}\n${homeUrl}`;

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
  const homeUrl = buildLineHomeUrl(input.entryToken, input.lang);
  if (!homeUrl) return false;

  const copy = TEXT.gallery[input.lang];
  const text = `${copy[0]}\n${homeUrl}\n\n${copy[1]}`;

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
  const detailUrl = buildPublicBookingDetailUrl(input.bookingNo, input.entryToken ?? undefined, input.lang);
  const text = [
    TEXT.pending[input.lang],
    `${bookingLabel(input.lang)}: ${input.bookingNo}`,
    detailUrl ? `${detailLabel(input.lang)}: ${detailUrl}` : null
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

export async function sendConfirmedBookingMessage(tx: Tx, input: {
  lineUserDbId: bigint;
  linePlatformUserId: string;
  bookingNo: string;
  entryToken?: string | null;
  lang: Lang;
}) {
  const detailUrl = buildPublicBookingDetailUrl(input.bookingNo, input.entryToken ?? undefined, input.lang);
  const text = [
    TEXT.confirmed[input.lang],
    `${bookingLabel(input.lang)}: ${input.bookingNo}`,
    detailUrl ? `${detailLabel(input.lang)}: ${detailUrl}` : null
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
