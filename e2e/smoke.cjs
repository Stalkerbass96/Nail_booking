const fs = require('node:fs/promises');
const path = require('node:path');

const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:3000';
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR || 'docs/testing/artifacts/e2e-2026-03-07';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'owner@nail-booking.local';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || 'dev-only-change-me';

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function getSetCookie(res) {
  const getSetCookieFn = res.headers.getSetCookie;
  if (typeof getSetCookieFn === 'function') {
    return getSetCookieFn.call(res.headers);
  }

  const combined = res.headers.get('set-cookie');
  return combined ? [combined] : [];
}

function extractCookieValue(setCookieHeaders, cookieName) {
  for (const header of setCookieHeaders) {
    const firstPart = header.split(';')[0] || '';
    if (firstPart.startsWith(`${cookieName}=`)) {
      return firstPart;
    }
  }
  return '';
}

async function saveArtifact(name, body) {
  const out = path.join(ARTIFACT_DIR, name);
  await fs.writeFile(out, body, 'utf8');
  return out;
}

async function check(name, fn, results) {
  const startedAt = Date.now();
  try {
    const detail = await fn();
    results.push({
      name,
      status: 'PASS',
      durationMs: Date.now() - startedAt,
      detail
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? `${error.message}${error.cause instanceof Error ? ` | cause: ${error.cause.message}` : ""}`
        : String(error);
    results.push({
      name,
      status: 'FAIL',
      durationMs: Date.now() - startedAt,
      detail: errorMessage
    });
  }
}

function assertContains(html, patterns, context) {
  if (patterns.some((p) => html.includes(p))) {
    return;
  }
  throw new Error(`${context} missing required text. Expected one of: ${patterns.join(' | ')}`);
}

async function main() {
  await ensureDir(ARTIFACT_DIR);
  const results = [];
  const cookieJar = { adminSession: '' };

  await check('Public services page loads', async () => {
    const res = await fetch(`${BASE_URL}/services`, { redirect: 'follow' });
    const html = await res.text();
    const artifact = await saveArtifact('services.html', html);

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}. Artifact: ${artifact}`);
    }

    assertContains(html, ['服务套餐', 'メニュー'], 'Services page');
    return `status=${res.status}, artifact=${artifact}`;
  }, results);

  await check('Booking page loads and key form controls visible', async () => {
    const res = await fetch(`${BASE_URL}/booking`, { redirect: 'follow' });
    const html = await res.text();
    const artifact = await saveArtifact('booking.html', html);

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}. Artifact: ${artifact}`);
    }

    assertContains(html, ['提交预约', '予約を作成'], 'Booking page title');
    assertContains(html, ['type="date"'], 'Booking date input');
    assertContains(html, ['<select'], 'Booking package selector');
    assertContains(html, ['type="email"'], 'Booking email input');
    return `status=${res.status}, artifact=${artifact}`;
  }, results);

  await check('Admin login page loads', async () => {
    const res = await fetch(`${BASE_URL}/admin/login`, { redirect: 'follow' });
    const html = await res.text();
    const artifact = await saveArtifact('admin-login.html', html);

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}. Artifact: ${artifact}`);
    }

    assertContains(html, ['管理员登录', '管理者ログイン'], 'Admin login title');
    assertContains(html, ['type="email"'], 'Admin login email input');
    assertContains(html, ['type="password"'], 'Admin login password input');
    return `status=${res.status}, artifact=${artifact}`;
  }, results);

  await check('Admin login with seeded credentials lands in admin area', async () => {
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
      redirect: 'manual'
    });

    const loginBody = await loginRes.text();
    const loginArtifact = await saveArtifact('admin-login-api.json', loginBody);

    if (loginRes.status !== 200) {
      throw new Error(`Login expected 200, got ${loginRes.status}. Artifact: ${loginArtifact}`);
    }

    const setCookies = getSetCookie(loginRes);
    const sessionCookie = extractCookieValue(setCookies, 'nb_admin_session');
    if (!sessionCookie) {
      throw new Error(`Login succeeded but no nb_admin_session cookie found. Artifact: ${loginArtifact}`);
    }
    cookieJar.adminSession = sessionCookie;

    const adminRes = await fetch(`${BASE_URL}/admin`, {
      headers: { cookie: cookieJar.adminSession },
      redirect: 'follow'
    });
    const adminHtml = await adminRes.text();
    const adminArtifact = await saveArtifact('admin-home.html', adminHtml);

    if (adminRes.status !== 200) {
      throw new Error(`Admin home expected 200, got ${adminRes.status}. Artifact: ${adminArtifact}`);
    }

    assertContains(adminHtml, ['管理后台', '管理コンソール'], 'Admin home page');
    return `login=${loginRes.status}, admin=${adminRes.status}, artifacts=${loginArtifact},${adminArtifact}`;
  }, results);

  await check('Admin panel route loads after login', async () => {
    if (!cookieJar.adminSession) {
      throw new Error('No admin session available from prior test.');
    }

    const res = await fetch(`${BASE_URL}/admin/appointments`, {
      headers: { cookie: cookieJar.adminSession },
      redirect: 'follow'
    });
    const html = await res.text();
    const artifact = await saveArtifact('admin-appointments.html', html);

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}. Artifact: ${artifact}`);
    }

    assertContains(html, ['预约管理', '予約管理'], 'Admin appointments route');
    return `status=${res.status}, artifact=${artifact}`;
  }, results);

  const summary = {
    baseUrl: BASE_URL,
    generatedAt: new Date().toISOString(),
    adminEmail: ADMIN_EMAIL,
    cases: results,
    passCount: results.filter((r) => r.status === 'PASS').length,
    failCount: results.filter((r) => r.status === 'FAIL').length
  };

  const summaryPath = path.join(ARTIFACT_DIR, 'summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

  console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));

  if (summary.failCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('E2E smoke run crashed:', error);
  process.exitCode = 1;
});
