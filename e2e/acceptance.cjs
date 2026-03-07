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
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || envFile.LINE_CHANNEL_SECRET || "";
const SERVER_START_TIMEOUT_MS = Number(process.env.E2E_SERVER_START_TIMEOUT_MS || 45000);
const SERVER_POLL_INTERVAL_MS = 500;
const RUN_ID = `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const TEST_PREFIX = `e2e-${RUN_ID}`;

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
      (value.startsWith("\"") && value.endsWith("\"")) ||
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
    return { startedByScript: false, stop: async () => {} };
  }

  const serverLogPath = path.join(ARTIFACT_DIR, "acceptance-server.log");
  const serverLog = fs.createWriteStream(serverLogPath, { flags: "w" });
  const serverProc = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3000"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
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
        }
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
    throw new Error(`${label} returned non-JSON body: ${text.slice(0, 200)}`);
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

async function runScheduleCase(result, adminCookie, packageId, cleanup) {
  const date = await findCleanTestDate();

  const openPayload = {
    type: "specialDate",
    date,
    isOpen: true,
    openTime: "10:00",
    closeTime: "18:00",
    note: TEST_PREFIX
  };

  const openRes = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: adminCookie
    },
    body: JSON.stringify(openPayload)
  });
  const openData = await assertJsonOk(openRes, "Open special date");
  const specialDate = (openData.specialDates || []).find((item) => item.date === date && item.note === TEST_PREFIX);
  if (!specialDate) {
    throw new Error("Created special business date was not returned by API");
  }
  cleanup.specialDateId = specialDate.id;

  const baseAvailabilityRes = await fetch(
    `${BASE_URL}/api/public/availability?packageId=${packageId}&date=${date}`
  );
  const baseAvailability = await assertJsonOk(baseAvailabilityRes, "Base availability");
  if (!Array.isArray(baseAvailability.slots) || baseAvailability.slots.length < 2) {
    throw new Error(`Expected at least 2 baseline slots, got ${baseAvailability.slots?.length ?? "unknown"}`);
  }

  const blockPayload = {
    type: "block",
    startAt: baseAvailability.slots[0].startAt,
    endAt: baseAvailability.slots[0].endAt,
    reason: TEST_PREFIX
  };

  const blockRes = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: adminCookie
    },
    body: JSON.stringify(blockPayload)
  });
  const blockData = await assertJsonOk(blockRes, "Create booking block");
  const block = (blockData.bookingBlocks || []).find(
    (item) => item.reason === TEST_PREFIX && item.startAt === blockPayload.startAt
  );
  if (!block) {
    throw new Error("Created booking block was not returned by API");
  }
  cleanup.bookingBlockId = block.id;

  const blockedAvailabilityRes = await fetch(
    `${BASE_URL}/api/public/availability?packageId=${packageId}&date=${date}`
  );
  const blockedAvailability = await assertJsonOk(blockedAvailabilityRes, "Blocked availability");
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
  cleanup.bookingBlockId = null;

  const closedRes = await fetch(`${BASE_URL}/api/admin/schedule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: adminCookie
    },
    body: JSON.stringify({
      type: "specialDate",
      date,
      isOpen: false,
      note: `${TEST_PREFIX}-closed`
    })
  });
  await assertJsonOk(closedRes, "Close special date");

  const closedAvailabilityRes = await fetch(
    `${BASE_URL}/api/public/availability?packageId=${packageId}&date=${date}`
  );
  const closedAvailability = await assertJsonOk(closedAvailabilityRes, "Closed availability");
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

async function runLineCase(result, bookingContext, cleanup) {
  if (!LINE_CHANNEL_SECRET) {
    result.status = "SKIP";
    result.detail = "LINE_CHANNEL_SECRET is not configured in .env or environment";
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
  cleanup.lineUserId = lineUser.id;

  const session = await prisma.lineLinkSession.create({
    data: {
      sessionToken,
      lineUserId: lineUser.id,
      lineLinkToken: `test-link-token-${RUN_ID}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });
  cleanup.lineLinkSessionId = session.id;

  const verifyRes = await fetch(`${BASE_URL}/api/public/line/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  const webhookBody = JSON.stringify({
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

  const webhookRes = await fetch(`${BASE_URL}/api/line/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-line-signature": createWebhookSignature(webhookBody, LINE_CHANNEL_SECRET)
    },
    body: webhookBody
  });
  await assertJsonOk(webhookRes, "LINE webhook accountLink");

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
      id: true,
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

  cleanup.lineLinkTokenId = token.id;

  const manageRes = await fetch(`${BASE_URL}/api/public/line/manage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingNo: bookingContext.bookingNo,
      email: bookingContext.email
    })
  });
  const manageData = await assertJsonOk(manageRes, "Public line manage");
  if (!manageData.linkedLineUser || manageData.linkedLineUser.lineUserId !== lineUserId) {
    throw new Error("Public line manage did not return the linked LINE account");
  }

  const unlinkRes = await fetch(`${BASE_URL}/api/public/line/manage`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      bookingNo: bookingContext.bookingNo,
      email: bookingContext.email
    })
  });
  const unlinkData = await assertJsonOk(unlinkRes, "Public line unlink");
  if (unlinkData.unlinkedCount !== 1) {
    throw new Error(`Expected unlinkedCount=1, got ${unlinkData.unlinkedCount}`);
  }

  cleanup.lineUserId = null;
  await prisma.lineUser.delete({ where: { id: lineUser.id } });

  result.detail = {
    bookingNo: bookingContext.bookingNo,
    linkedLineUserId: lineUserId,
    redirectUrl: verifyData.redirectUrl
  };
}

async function createBookingFixture(servicePackage) {
  const customer = await prisma.customer.create({
    data: {
      name: `Acceptance ${TEST_PREFIX}`,
      email: `${TEST_PREFIX}@example.com`
    }
  });

  const startAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  startAt.setUTCHours(1, 0, 0, 0);
  const endAt = new Date(startAt.getTime() + servicePackage.durationMin * 60 * 1000);

  const appointment = await prisma.appointment.create({
    data: {
      bookingNo: makeBookingNo(),
      customerId: customer.id,
      packageId: servicePackage.id,
      styleNote: `${TEST_PREFIX}-style`,
      customerNote: `${TEST_PREFIX}-note`,
      startAt,
      endAt,
      status: AppointmentStatus.confirmed,
      autoCancelAt: new Date(startAt.getTime() - 24 * 60 * 60 * 1000),
      confirmedAt: new Date()
    }
  });

  return {
    customerId: customer.id,
    customerEmail: customer.email,
    appointmentId: appointment.id,
    bookingNo: appointment.bookingNo,
    email: customer.email
  };
}

async function cleanupFixtures(cleanup) {
  try {
    if (cleanup.bookingBlockId) {
      await prisma.bookingBlock.delete({ where: { id: cleanup.bookingBlockId } }).catch(() => {});
    }

    if (cleanup.specialDateId) {
      await prisma.specialBusinessDate.delete({ where: { id: cleanup.specialDateId } }).catch(() => {});
    }

    if (cleanup.lineUserId) {
      await prisma.lineUser.updateMany({
        where: { id: cleanup.lineUserId },
        data: { customerId: null }
      }).catch(() => {});
      await prisma.lineUser.delete({ where: { id: cleanup.lineUserId } }).catch(() => {});
    }

    if (cleanup.appointmentId) {
      await prisma.appointment.delete({ where: { id: cleanup.appointmentId } }).catch(() => {});
    }

    if (cleanup.customerId) {
      await prisma.customer.delete({ where: { id: cleanup.customerId } }).catch(() => {});
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
    bookingBlockId: null,
    specialDateId: null,
    lineUserId: null,
    lineLinkSessionId: null,
    lineLinkTokenId: null,
    appointmentId: null,
    customerId: null
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
    const bookingFixture = await createBookingFixture(servicePackage);
    cleanup.appointmentId = bookingFixture.appointmentId;
    cleanup.customerId = bookingFixture.customerId;

    const scheduleCase = { name: "schedule-blocking", status: "PASS", detail: null };
    try {
      await runScheduleCase(scheduleCase, adminCookie, servicePackage.id.toString(), cleanup);
    } catch (error) {
      scheduleCase.status = "FAIL";
      scheduleCase.detail = error instanceof Error ? error.message : String(error);
    }
    summary.cases.push(scheduleCase);

    const lineCase = { name: "line-self-linking", status: "PASS", detail: null };
    try {
      await runLineCase(lineCase, bookingFixture, cleanup);
    } catch (error) {
      lineCase.status = "FAIL";
      lineCase.detail = error instanceof Error ? error.message : String(error);
    }
    summary.cases.push(lineCase);
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
