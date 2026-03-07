const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { PrismaClient, AppointmentStatus } = require("@prisma/client");

const prisma = new PrismaClient();

const envFile = readEnvFile(path.join(process.cwd(), ".env"));
const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const ARTIFACT_DIR =
  process.env.E2E_ARTIFACT_DIR ||
  path.join("docs", "testing", "artifacts", `acceptance-${new Date().toISOString().slice(0, 10)}`);
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || envFile.ADMIN_EMAIL || "owner@nail-booking.local";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ||
  process.env.ADMIN_SEED_PASSWORD ||
  envFile.ADMIN_SEED_PASSWORD ||
  "dev-only-change-me";
const APP_BASE_URL = process.env.APP_BASE_URL || envFile.APP_BASE_URL || BASE_URL;
const RAW_LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || envFile.LINE_CHANNEL_SECRET || "";
const FALLBACK_LINE_CHANNEL_SECRET = "acceptance-test-secret";
const SERVER_START_TIMEOUT_MS = Number(process.env.E2E_SERVER_START_TIMEOUT_MS || 45000);
const SERVER_POLL_INTERVAL_MS = 500;
const RUN_ID = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const TEST_PREFIX = `e2e-${RUN_ID}`;
const INITIAL_TEST_POINTS = 10;
const COMPLETE_ACTUAL_PAID_JPY = 12340;
const COMPLETE_USE_POINTS = 10;

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const values = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getSetCookie(res) {
  const getSetCookieFn = res.headers.getSetCookie;
  if (typeof getSetCookieFn === "function") {
    return getSetCookieFn.call(res.headers);
  }

  const combined = res.headers.get("set-cookie");
  return combined ? [combined] : [];
}

function extractCookieValue(setCookieHeaders, cookieName) {
  for (const header of setCookieHeaders) {
    const firstPart = header.split(";")[0] || "";
    if (firstPart.startsWith(`${cookieName}=`)) {
      return firstPart;
    }
  }
  return "";
}

async function saveArtifact(name, body) {
  const out = path.join(ARTIFACT_DIR, name);
  await fsp.writeFile(out, body, "utf8");
  return out;
}

async function isServerReachable() {
  try {
    const res = await fetch(`${BASE_URL}/admin/login`, { redirect: "manual" });
    return res.status >= 200 && res.status < 500;
  } catch {
    return false;
  }
}

async function stopProcessTree(pid) {
  if (!pid) return;

  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true
      });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {}
  await sleep(300);
  try {
    process.kill(-pid, "SIGKILL");
  } catch {}
}

async function ensureServerRunning() {
  if (await isServerReachable()) {
    return {
      startedByScript: false,
      stop: async () => {},
      lineChannelSecret: RAW_LINE_CHANNEL_SECRET,
      appBaseUrl: process.env.APP_BASE_URL || envFile.APP_BASE_URL || ""
    };
  }

  const serverLogPath = path.join(ARTIFACT_DIR, "acceptance-server.log");
  const serverLog = fs.createWriteStream(serverLogPath, { flags: "w" });
  const serverEnv = {
    ...process.env,
    LINE_CHANNEL_SECRET: RAW_LINE_CHANNEL_SECRET || FALLBACK_LINE_CHANNEL_SECRET,
    APP_BASE_URL
  };

  const serverProc = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: serverEnv,
    detached: process.platform !== "win32",
    shell: process.platform === "win32"
  });

  serverProc.stdout?.pipe(serverLog);
  serverProc.stderr?.pipe(serverLog);

  const startedAt = Date.now();
  while (Date.now() - startedAt < SERVER_START_TIMEOUT_MS) {
    if (serverProc.exitCode !== null) {
      serverLog.end();
      throw new Error(
        `Managed dev server exited early with code ${serverProc.exitCode}. See artifact: ${serverLogPath}`
      );
    }

    if (await isServerReachable()) {
      return {
        startedByScript: true,
        stop: async () => {
          await stopProcessTree(serverProc.pid);
          serverLog.end();
        },
        lineChannelSecret: serverEnv.LINE_CHANNEL_SECRET,
        appBaseUrl: serverEnv.APP_BASE_URL
      };
    }

    await sleep(SERVER_POLL_INTERVAL_MS);
  }

  await stopProcessTree(serverProc.pid);
  serverLog.end();
  throw new Error(`Timed out waiting for managed dev server at ${BASE_URL}. See artifact: ${serverLogPath}`);
}

async function assertJsonOk(res, label) {
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned non-JSON body: ${text.slice(0, 400)}`);
  }

  if (!res.ok) {
    throw new Error(`${label} failed with ${res.status}: ${text}`);
  }

  return data;
}

function createWebhookSignature(body, secret) {
  return crypto.createHmac("sha256", secret).update(body).digest("base64");
}

function makeBookingNo() {
  return `NB-${RUN_ID.replace(/[^0-9a-z]/gi, "").slice(-12).toUpperCase()}`;
}

function jsonHeaders(cookie) {
  return cookie
    ? { "Content-Type": "application/json", cookie }
    : { "Content-Type": "application/json" };
}

async function loginAdmin() {
  const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    redirect: "manual"
  });

  const body = await loginRes.text();
  await saveArtifact("acceptance-admin-login.json", body);

  if (loginRes.status !== 200) {
    throw new Error(`Admin login failed with ${loginRes.status}: ${body}`);
  }

  const cookie = extractCookieValue(getSetCookie(loginRes), "nb_admin_session");
  if (!cookie) {
    throw new Error("Admin login succeeded but session cookie is missing");
  }

  return cookie;
}

async function getPointRatios() {
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: { in: ["point_earn_ratio_jpy", "point_redeem_ratio_jpy"] }
    },
    select: { key: true, value: true }
  });

  const byKey = new Map(settings.map((item) => [item.key, item.value]));
  const earnRatio = Number.parseInt(byKey.get("point_earn_ratio_jpy") || "100", 10);
  const redeemRatio = Number.parseInt(byKey.get("point_redeem_ratio_jpy") || "100", 10);

  return {
    earnRatio: Number.isFinite(earnRatio) && earnRatio > 0 ? earnRatio : 100,
    redeemRatio: Number.isFinite(redeemRatio) && redeemRatio > 0 ? redeemRatio : 100
  };
}

async function findCleanTestDate() {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 14);

  for (let offset = 0; offset < 90; offset += 1) {
    const date = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000);
    const ymd = date.toISOString().slice(0, 10);
    const existing = await prisma.specialBusinessDate.findUnique({
      where: { date: new Date(`${ymd}T00:00:00.000Z`) },
      select: { id: true }
    });

    if (!existing) {
      return ymd;
    }
  }

  throw new Error("Unable to find a clean future date for acceptance testing");
}

async function createOpenSpecialDate(adminCookie, cleanup, note, openTime = "10:00", closeTime = "18:00") {
  const date = await findCleanTestDate();
  const payload = {
    type: "specialDate",
    date,
    isOpen: true,
    openTime,
    closeTime,
    note
  };

  const res = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: jsonHeaders(adminCookie),
    body: JSON.stringify(payload)
  });
  const data = await assertJsonOk(res, "Create special business date");
  const specialDate = (data.specialDates || []).find((item) => item.date === date && item.note === note);
  if (!specialDate) {
    throw new Error("Created special business date was not returned by API");
  }

  cleanup.specialDateIds.push(specialDate.id);
  return date;
}

async function fetchAvailability(packageId, date) {
  const res = await fetch(`${BASE_URL}/api/public/availability?packageId=${packageId}&date=${date}`);
  return assertJsonOk(res, `Availability for ${date}`);
}

async function runScheduleCase(result, adminCookie, packageId, cleanup) {
  const date = await createOpenSpecialDate(adminCookie, cleanup, `${TEST_PREFIX}-schedule`, "10:00", "18:00");
  const baseAvailability = await fetchAvailability(packageId, date);
  if (!Array.isArray(baseAvailability.slots) || baseAvailability.slots.length < 2) {
    throw new Error(`Expected at least 2 baseline slots, got ${baseAvailability.slots?.length ?? "unknown"}`);
  }

  const blockPayload = {
    type: "block",
    startAt: baseAvailability.slots[0].startAt,
    endAt: baseAvailability.slots[0].endAt,
    reason: `${TEST_PREFIX}-block`
  };

  const blockRes = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: jsonHeaders(adminCookie),
    body: JSON.stringify(blockPayload)
  });
  const blockData = await assertJsonOk(blockRes, "Create booking block");
  const block = (blockData.bookingBlocks || []).find(
    (item) => item.reason === blockPayload.reason && item.startAt === blockPayload.startAt
  );
  if (!block) {
    throw new Error("Created booking block was not returned by API");
  }
  cleanup.bookingBlockIds.push(block.id);

  const blockedAvailability = await fetchAvailability(packageId, date);
  if (blockedAvailability.slots.length >= baseAvailability.slots.length) {
    throw new Error(
      `Expected blocked availability to shrink. before=${baseAvailability.slots.length}, after=${blockedAvailability.slots.length}`
    );
  }

  const deleteBlockRes = await fetch(`${BASE_URL}/api/admin/schedule/blocks/${block.id}`, {
    method: "DELETE",
    headers: { cookie: adminCookie }
  });
  await assertJsonOk(deleteBlockRes, "Delete booking block");
  cleanup.bookingBlockIds = cleanup.bookingBlockIds.filter((item) => item !== block.id);

  const closedRes = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: jsonHeaders(adminCookie),
    body: JSON.stringify({
      type: "specialDate",
      date,
      isOpen: false,
      note: `${TEST_PREFIX}-schedule-closed`
    })
  });
  await assertJsonOk(closedRes, "Close special date");

  const closedAvailability = await fetchAvailability(packageId, date);
  if (closedAvailability.slots.length !== 0) {
    throw new Error(`Expected closed day to have 0 slots, got ${closedAvailability.slots.length}`);
  }

  result.detail = {
    date,
    baseSlots: baseAvailability.slots.length,
    blockedSlots: blockedAvailability.slots.length,
    closedSlots: closedAvailability.slots.length
  };
}

async function createLineFixture(servicePackage, cleanup) {
  const customer = await prisma.customer.create({
    data: {
      name: `Acceptance ${TEST_PREFIX} Line`,
      email: `${TEST_PREFIX}-line@example.com`
    }
  });
  cleanup.customerIds.push(customer.id);

  const startAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  startAt.setUTCHours(1, 0, 0, 0);
  const endAt = new Date(startAt.getTime() + servicePackage.durationMin * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      bookingNo: makeBookingNo(),
      customerId: customer.id,
      packageId: servicePackage.id,
      styleNote: `${TEST_PREFIX}-line-style`,
      customerNote: `${TEST_PREFIX}-line-note`,
      startAt,
      endAt,
      status: AppointmentStatus.confirmed,
      autoCancelAt: new Date(startAt.getTime() - 24 * 60 * 60 * 1000),
      confirmedAt: new Date()
    }
  });
  cleanup.appointmentIds.push(appointment.id);

  return {
    customerId: customer.id,
    bookingNo: appointment.bookingNo,
    email: customer.email
  };
}

async function runLineCase(result, adminCookie, bookingContext, cleanup, lineChannelSecret) {
  if (!lineChannelSecret) {
    result.status = "SKIP";
    result.detail = "LINE_CHANNEL_SECRET is not configured and the acceptance script did not manage the server process";
    return;
  }

  const sessionToken = crypto.randomBytes(18).toString("hex");
  const lineUserId = `U${crypto.randomBytes(16).toString("hex")}`;

  const lineUser = await prisma.lineUser.create({
    data: {
      lineUserId,
      displayName: `LINE ${TEST_PREFIX}`,
      isFollowing: true
    }
  });
  cleanup.lineUserIds.push(lineUser.id);

  await prisma.lineLinkSession.create({
    data: {
      sessionToken,
      lineUserId: lineUser.id,
      lineLinkToken: `test-link-token-${RUN_ID}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });

  const verifyRes = await fetch(`${BASE_URL}/api/public/line/link`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      sessionToken,
      bookingNo: bookingContext.bookingNo,
      email: bookingContext.email
    })
  });
  const verifyData = await assertJsonOk(verifyRes, "Public line verify");

  const redirectUrl = new URL(verifyData.redirectUrl);
  const nonce = redirectUrl.searchParams.get("nonce");
  if (!nonce) {
    throw new Error(`LINE redirect URL missing nonce: ${verifyData.redirectUrl}`);
  }

  const accountLinkBody = JSON.stringify({
    destination: "acceptance-test",
    events: [
      {
        type: "accountLink",
        mode: "active",
        timestamp: Date.now(),
        source: {
          type: "user",
          userId: lineUserId
        },
        link: {
          result: "ok",
          nonce
        }
      }
    ]
  });

  const accountLinkRes = await fetch(`${BASE_URL}/api/line/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-line-signature": createWebhookSignature(accountLinkBody, lineChannelSecret)
    },
    body: accountLinkBody
  });
  await assertJsonOk(accountLinkRes, "LINE webhook accountLink");

  const linkedUser = await prisma.lineUser.findUnique({
    where: { id: lineUser.id },
    select: {
      customerId: true,
      linkedAt: true
    }
  });
  const token = await prisma.lineLinkToken.findFirst({
    where: { token: nonce },
    select: {
      consumedAt: true
    }
  });

  if (!linkedUser || linkedUser.customerId?.toString() !== bookingContext.customerId.toString()) {
    throw new Error("LINE user was not linked to the expected customer");
  }
  if (!linkedUser.linkedAt) {
    throw new Error("LINE user linkedAt was not recorded");
  }
  if (!token?.consumedAt) {
    throw new Error("Line link token was not consumed after webhook");
  }

  const manageRes = await fetch(`${BASE_URL}/api/public/line/manage`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      bookingNo: bookingContext.bookingNo,
      email: bookingContext.email
    })
  });
  const manageData = await assertJsonOk(manageRes, "Public line manage");
  if (!manageData.linkedLineUser || manageData.linkedLineUser.lineUserId !== lineUserId) {
    throw new Error("Public line manage did not return the linked LINE account");
  }

  const incomingMessageBody = JSON.stringify({
    destination: "acceptance-test",
    events: [
      {
        type: "message",
        mode: "active",
        timestamp: Date.now(),
        source: {
          type: "user",
          userId: lineUserId
        },
        message: {
          id: `msg-${RUN_ID}`,
          type: "text",
          text: "Acceptance unread check"
        }
      }
    ]
  });

  const incomingRes = await fetch(`${BASE_URL}/api/line/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-line-signature": createWebhookSignature(incomingMessageBody, lineChannelSecret)
    },
    body: incomingMessageBody
  });
  await assertJsonOk(incomingRes, "LINE webhook message");

  const usersBeforeReadRes = await fetch(`${BASE_URL}/api/admin/line/users`, {
    headers: { cookie: adminCookie }
  });
  const usersBeforeRead = await assertJsonOk(usersBeforeReadRes, "Admin line users before read");
  const beforeReadItem = (usersBeforeRead.items || []).find((item) => item.lineUserId === lineUserId);
  if (!beforeReadItem || beforeReadItem.unreadCount < 1) {
    throw new Error("Unread count did not increase after incoming LINE message");
  }

  const messagesRes = await fetch(`${BASE_URL}/api/admin/line/users/${beforeReadItem.id}/messages`, {
    headers: { cookie: adminCookie }
  });
  const messagesData = await assertJsonOk(messagesRes, "Admin line messages");
  const unreadMessage = (messagesData.messages || []).find(
    (item) => item.direction === "incoming" && item.text === "Acceptance unread check"
  );
  if (!unreadMessage) {
    throw new Error("Incoming LINE message did not appear in conversation history");
  }

  const usersAfterReadRes = await fetch(`${BASE_URL}/api/admin/line/users`, {
    headers: { cookie: adminCookie }
  });
  const usersAfterRead = await assertJsonOk(usersAfterReadRes, "Admin line users after read");
  const afterReadItem = (usersAfterRead.items || []).find((item) => item.lineUserId === lineUserId);
  if (!afterReadItem || afterReadItem.unreadCount !== 0) {
    throw new Error("Unread count was not cleared after opening the LINE conversation");
  }

  const unlinkRes = await fetch(`${BASE_URL}/api/public/line/manage`, {
    method: "DELETE",
    headers: jsonHeaders(),
    body: JSON.stringify({
      bookingNo: bookingContext.bookingNo,
      email: bookingContext.email
    })
  });
  const unlinkData = await assertJsonOk(unlinkRes, "Public line unlink");
  if (unlinkData.unlinkedCount !== 1) {
    throw new Error(`Expected unlinkedCount=1, got ${unlinkData.unlinkedCount}`);
  }

  result.detail = {
    bookingNo: bookingContext.bookingNo,
    linkedLineUserId: lineUserId,
    redirectUrl: verifyData.redirectUrl,
    unreadBeforeRead: beforeReadItem.unreadCount
  };
}

async function runBookingLifecycleCase(result, adminCookie, servicePackage, cleanup) {
  const ratios = await getPointRatios();
  const date = await createOpenSpecialDate(adminCookie, cleanup, `${TEST_PREFIX}-booking`, "11:00", "19:00");
  const availability = await fetchAvailability(servicePackage.id.toString(), date);
  if (!availability.slots?.length) {
    throw new Error(`No slots available for booking lifecycle on ${date}`);
  }

  const slot = availability.slots[0];
  const email = `${TEST_PREFIX}-booking@example.com`;
  const createPayload = {
    name: `Lifecycle ${TEST_PREFIX}`,
    email,
    packageId: servicePackage.id.toString(),
    addonIds: [],
    startAt: slot.startAt,
    styleNote: `${TEST_PREFIX}-style`,
    customerNote: `${TEST_PREFIX}-customer-note`,
    lang: "zh"
  };

  const createRes = await fetch(`${BASE_URL}/api/public/appointments`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(createPayload)
  });
  const created = await assertJsonOk(createRes, "Public create appointment");

  const appointment = await prisma.appointment.findUnique({
    where: { bookingNo: created.bookingNo },
    include: {
      customer: {
        select: { id: true, email: true, currentPoints: true }
      }
    }
  });
  if (!appointment) {
    throw new Error("Created appointment could not be found in database");
  }
  cleanup.appointmentIds.push(appointment.id);
  cleanup.customerIds.push(appointment.customer.id);

  const pendingLookupRes = await fetch(
    `${BASE_URL}/api/public/appointments/lookup?bookingNo=${encodeURIComponent(created.bookingNo)}&email=${encodeURIComponent(email)}`
  );
  const pendingLookup = await assertJsonOk(pendingLookupRes, "Lookup pending appointment");
  if (pendingLookup.status !== "pending") {
    throw new Error(`Expected pending lookup status, got ${pendingLookup.status}`);
  }

  const adminListRes = await fetch(`${BASE_URL}/api/admin/appointments?date=${date}&status=pending&limit=200`, {
    headers: { cookie: adminCookie }
  });
  const adminList = await assertJsonOk(adminListRes, "Admin appointments list");
  const adminItem = (adminList.items || []).find((item) => item.bookingNo === created.bookingNo);
  if (!adminItem) {
    throw new Error("Created appointment did not appear in admin pending list");
  }

  const confirmRes = await fetch(`${BASE_URL}/api/admin/appointments/${adminItem.id}/confirm`, {
    method: "PATCH",
    headers: jsonHeaders(adminCookie),
    body: JSON.stringify({})
  });
  const confirmed = await assertJsonOk(confirmRes, "Confirm appointment");
  if (confirmed.status !== "confirmed") {
    throw new Error(`Expected confirmed status, got ${confirmed.status}`);
  }

  const confirmedLookupRes = await fetch(
    `${BASE_URL}/api/public/appointments/lookup?bookingNo=${encodeURIComponent(created.bookingNo)}&email=${encodeURIComponent(email)}`
  );
  const confirmedLookup = await assertJsonOk(confirmedLookupRes, "Lookup confirmed appointment");
  if (confirmedLookup.status !== "confirmed") {
    throw new Error(`Expected confirmed lookup status, got ${confirmedLookup.status}`);
  }

  await prisma.customer.update({
    where: { id: appointment.customer.id },
    data: { currentPoints: INITIAL_TEST_POINTS }
  });

  const completeRes = await fetch(`${BASE_URL}/api/admin/appointments/${adminItem.id}/complete`, {
    method: "PATCH",
    headers: jsonHeaders(adminCookie),
    body: JSON.stringify({
      actualPaidJpy: COMPLETE_ACTUAL_PAID_JPY,
      usePoints: COMPLETE_USE_POINTS,
      note: `${TEST_PREFIX}-complete`
    })
  });
  const completed = await assertJsonOk(completeRes, "Complete appointment");
  const expectedEarnedPoints = Math.floor(COMPLETE_ACTUAL_PAID_JPY / ratios.earnRatio);
  const expectedCurrentPoints = INITIAL_TEST_POINTS - COMPLETE_USE_POINTS + expectedEarnedPoints;
  if (completed.status !== "completed") {
    throw new Error(`Expected completed status, got ${completed.status}`);
  }
  if (completed.earnedPoints !== expectedEarnedPoints) {
    throw new Error(`Expected earnedPoints=${expectedEarnedPoints}, got ${completed.earnedPoints}`);
  }
  if (completed.currentPoints !== expectedCurrentPoints) {
    throw new Error(`Expected currentPoints=${expectedCurrentPoints}, got ${completed.currentPoints}`);
  }

  const completedLookupRes = await fetch(
    `${BASE_URL}/api/public/appointments/lookup?bookingNo=${encodeURIComponent(created.bookingNo)}&email=${encodeURIComponent(email)}`
  );
  const completedLookup = await assertJsonOk(completedLookupRes, "Lookup completed appointment");
  if (completedLookup.status !== "completed") {
    throw new Error(`Expected completed lookup status, got ${completedLookup.status}`);
  }

  const customerId = appointment.customer.id.toString();
  const ledgerRes = await fetch(`${BASE_URL}/api/admin/points/ledger?customerId=${customerId}&limit=20`, {
    headers: { cookie: adminCookie }
  });
  const ledger = await assertJsonOk(ledgerRes, "Points ledger");
  const earnItem = (ledger.items || []).find((item) => item.type === "earn" && item.appointmentId === adminItem.id);
  const useItem = (ledger.items || []).find((item) => item.type === "use" && item.appointmentId === adminItem.id);
  if (!earnItem || earnItem.points !== expectedEarnedPoints) {
    throw new Error("Expected earn ledger entry was not found");
  }
  if (!useItem || useItem.points !== COMPLETE_USE_POINTS || useItem.jpyValue !== COMPLETE_USE_POINTS * ratios.redeemRatio) {
    throw new Error("Expected use ledger entry was not found");
  }

  const customersRes = await fetch(`${BASE_URL}/api/admin/customers?q=${encodeURIComponent(email)}&limit=20`, {
    headers: { cookie: adminCookie }
  });
  const customers = await assertJsonOk(customersRes, "Customers search");
  const customerItem = (customers.items || []).find((item) => item.email === email);
  if (!customerItem) {
    throw new Error("Customer search did not return the booking customer");
  }
  if (customerItem.totalSpentJpy !== COMPLETE_ACTUAL_PAID_JPY || customerItem.currentPoints !== expectedCurrentPoints) {
    throw new Error(
      `Unexpected customer totals. spent=${customerItem.totalSpentJpy}, points=${customerItem.currentPoints}`
    );
  }

  result.detail = {
    bookingNo: created.bookingNo,
    date,
    startAt: slot.startAt,
    earnedPoints: expectedEarnedPoints,
    currentPoints: expectedCurrentPoints
  };
}

async function cleanupFixtures(cleanup) {
  try {
    for (const bookingBlockId of cleanup.bookingBlockIds.slice().reverse()) {
      await prisma.bookingBlock.delete({ where: { id: BigInt(bookingBlockId) } }).catch(() => {});
    }

    for (const appointmentId of cleanup.appointmentIds.slice().reverse()) {
      await prisma.pointLedger.deleteMany({ where: { appointmentId } }).catch(() => {});
      await prisma.appointmentAddon.deleteMany({ where: { appointmentId } }).catch(() => {});
      await prisma.appointment.delete({ where: { id: appointmentId } }).catch(() => {});
    }

    for (const lineUserId of cleanup.lineUserIds.slice().reverse()) {
      await prisma.lineUser.updateMany({
        where: { id: lineUserId },
        data: { customerId: null }
      }).catch(() => {});
      await prisma.lineUser.delete({ where: { id: lineUserId } }).catch(() => {});
    }

    for (const customerId of cleanup.customerIds.slice().reverse()) {
      await prisma.pointLedger.deleteMany({ where: { customerId } }).catch(() => {});
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
    }

    for (const specialDateId of cleanup.specialDateIds.slice().reverse()) {
      await prisma.specialBusinessDate.delete({ where: { id: BigInt(specialDateId) } }).catch(() => {});
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await ensureDir(ARTIFACT_DIR);

  const summary = {
    runId: RUN_ID,
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    cases: []
  };
  const cleanup = {
    bookingBlockIds: [],
    specialDateIds: [],
    lineUserIds: [],
    appointmentIds: [],
    customerIds: []
  };

  const server = await ensureServerRunning();

  try {
    const servicePackage = await prisma.servicePackage.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, durationMin: true }
    });

    if (!servicePackage) {
      throw new Error("No active service package found for acceptance test");
    }

    const adminCookie = await loginAdmin();

    const scheduleCase = { name: "schedule-blocking", status: "PASS", detail: null };
    try {
      await runScheduleCase(scheduleCase, adminCookie, servicePackage.id.toString(), cleanup);
    } catch (error) {
      scheduleCase.status = "FAIL";
      scheduleCase.detail = error instanceof Error ? error.message : String(error);
    }
    summary.cases.push(scheduleCase);

    const lineFixture = await createLineFixture(servicePackage, cleanup);
    const lineCase = { name: "line-self-linking", status: "PASS", detail: null };
    try {
      await runLineCase(lineCase, adminCookie, lineFixture, cleanup, server.lineChannelSecret);
    } catch (error) {
      lineCase.status = "FAIL";
      lineCase.detail = error instanceof Error ? error.message : String(error);
    }
    summary.cases.push(lineCase);

    const bookingCase = { name: "booking-lifecycle", status: "PASS", detail: null };
    try {
      await runBookingLifecycleCase(bookingCase, adminCookie, servicePackage, cleanup);
    } catch (error) {
      bookingCase.status = "FAIL";
      bookingCase.detail = error instanceof Error ? error.message : String(error);
    }
    summary.cases.push(bookingCase);
  } finally {
    await cleanupFixtures(cleanup);
    await server.stop();
  }

  summary.passCount = summary.cases.filter((item) => item.status === "PASS").length;
  summary.failCount = summary.cases.filter((item) => item.status === "FAIL").length;
  summary.skipCount = summary.cases.filter((item) => item.status === "SKIP").length;

  const summaryPath = path.join(ARTIFACT_DIR, "acceptance-summary.json");
  await fsp.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));

  if (summary.failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error) => {
  console.error("Acceptance run crashed:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
