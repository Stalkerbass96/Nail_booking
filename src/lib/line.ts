import { createHmac, randomBytes } from "node:crypto";

const LINE_API_BASE = "https://api.line.me";
const LINE_LINK_BASE = "https://access.line.me/dialog/bot/accountLink";

export type LineProfile = {
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export function getLineConfig() {
  return {
    channelSecret: process.env.LINE_CHANNEL_SECRET?.trim() || "",
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || "",
    autoReplyText:
      process.env.LINE_AUTO_REPLY_TEXT?.trim() ||
      "Message received. The salon owner will reply to you shortly.",
    appBaseUrl: process.env.APP_BASE_URL?.trim().replace(/\/$/, "") || "",
    enabled:
      Boolean(process.env.LINE_CHANNEL_SECRET?.trim()) &&
      Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim())
  };
}

export function verifyLineSignature(rawBody: string, signature: string): boolean {
  const { channelSecret } = getLineConfig();
  if (!channelSecret || !signature) return false;

  const expected = createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  return expected === signature;
}

export function buildLineSignature(rawBody: string, channelSecret: string): string {
  return createHmac("sha256", channelSecret).update(rawBody).digest("base64");
}

async function lineApiFetch(path: string, init: RequestInit = {}) {
  const { channelAccessToken } = getLineConfig();
  if (!channelAccessToken) {
    throw new Error("LINE channel access token is not configured");
  }

  const response = await fetch(`${LINE_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE API request failed (${response.status}): ${body}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function issueLineLinkToken(userId: string): Promise<string> {
  const response = await lineApiFetch(`/v2/bot/user/${encodeURIComponent(userId)}/linkToken`, {
    method: "POST",
    body: JSON.stringify({})
  });

  if (!response || typeof response.linkToken !== "string") {
    throw new Error("LINE issue link token response is invalid");
  }

  return response.linkToken;
}

export function buildLineAccountLinkUrl(linkToken: string, nonce: string) {
  return `${LINE_LINK_BASE}?linkToken=${encodeURIComponent(linkToken)}&nonce=${encodeURIComponent(nonce)}`;
}

export async function getLineProfile(userId: string): Promise<LineProfile | null> {
  try {
    const response = await lineApiFetch(`/v2/bot/profile/${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {}
    });

    if (!response || typeof response !== "object") return null;

    return {
      displayName: typeof response.displayName === "string" ? response.displayName : undefined,
      pictureUrl: typeof response.pictureUrl === "string" ? response.pictureUrl : undefined,
      statusMessage: typeof response.statusMessage === "string" ? response.statusMessage : undefined
    };
  } catch {
    return null;
  }
}

export async function replyLineTextMessage(replyToken: string, text: string) {
  await lineApiFetch("/v2/bot/message/reply", {
    method: "POST",
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });
}

export async function pushLineTextMessage(userId: string, text: string) {
  await lineApiFetch("/v2/bot/message/push", {
    method: "POST",
    body: JSON.stringify({
      to: userId,
      messages: [
        {
          type: "text",
          text
        }
      ]
    })
  });
}

export function createLineLinkToken() {
  return randomBytes(24).toString("hex");
}

export function buildAppUrl(pathname: string, params?: Record<string, string | undefined | null>) {
  const { appBaseUrl } = getLineConfig();
  if (!appBaseUrl) return "";

  const url = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, `${appBaseUrl}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }
  }

  return url.toString();
}

export function buildLineHomeUrl(entryToken: string, lang = "zh") {
  return buildAppUrl("/", { entry: entryToken, lang });
}

export function buildPublicBookingDetailUrl(bookingNo: string, entryToken?: string, lang = "zh") {
  return buildAppUrl(`/booking/${encodeURIComponent(bookingNo)}`, {
    entry: entryToken,
    lang
  });
}
