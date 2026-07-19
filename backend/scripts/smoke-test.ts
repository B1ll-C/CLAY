/**
 * Backend smoke test: exercises health + the full auth lifecycle against a
 * running server (register -> login -> me -> refresh -> me -> logout ->
 * refresh should now fail).
 *
 * Usage (from backend/):
 *   npm run test:auth
 *   npm run test:auth -- --email you+test@gmail.com --password testpass123
 *
 * Env overrides: BASE_URL (default http://localhost:3000)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const EMAIL = arg('email', 'wh04m1.b+smoketest@gmail.com');
const PASSWORD = arg('password', 'testpass123');

let passed = 0;
let failed = 0;

function ok(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
  } else {
    failed++;
    console.log(`  \x1b[31m✗\x1b[0m ${label}`);
    if (detail !== undefined) console.log(`    ${JSON.stringify(detail)}`);
  }
}

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

async function main() {
  console.log(`Running smoke test against ${BASE_URL} as ${EMAIL}\n`);

  console.log('Health');
  const health = await req('GET', '/health');
  ok('GET /health -> 200', health.status === 200, health.json);

  const healthDb = await req('GET', '/health/db');
  ok('GET /health/db -> 200', healthDb.status === 200, healthDb.json);

  console.log('\nRegister');
  const register = await req('POST', '/api/v1/auth/register', { email: EMAIL, password: PASSWORD });
  ok(
    'POST /auth/register -> 201 (new) or 409 EMAIL_TAKEN (already exists)',
    register.status === 201 || (register.status === 409 && register.json?.error?.code === 'EMAIL_TAKEN'),
    register.json,
  );

  console.log('\nLogin');
  const login = await req('POST', '/api/v1/auth/login', { email: EMAIL, password: PASSWORD });
  ok('POST /auth/login -> 200 with tokens', login.status === 200 && !!login.json?.accessToken, login.json);
  const accessToken = login.json?.accessToken as string | undefined;
  const refreshToken = login.json?.refreshToken as string | undefined;

  console.log('\nMe (access token)');
  if (accessToken) {
    const me = await req('GET', '/api/v1/me', undefined, accessToken);
    ok('GET /me -> 200 with matching email', me.status === 200 && me.json?.email === EMAIL, me.json);
  } else {
    ok('GET /me skipped (no access token)', false);
  }

  console.log('\nRefresh');
  let newAccessToken: string | undefined;
  let newRefreshToken: string | undefined;
  if (refreshToken) {
    const refresh = await req('POST', '/api/v1/auth/refresh', { refreshToken });
    ok('POST /auth/refresh -> 200 with new tokens', refresh.status === 200 && !!refresh.json?.accessToken, refresh.json);
    newAccessToken = refresh.json?.accessToken;
    newRefreshToken = refresh.json?.refreshToken;
  } else {
    ok('POST /auth/refresh skipped (no refresh token)', false);
  }

  console.log('\nMe (post-refresh access token)');
  if (newAccessToken) {
    const me2 = await req('GET', '/api/v1/me', undefined, newAccessToken);
    ok('GET /me -> 200 after refresh', me2.status === 200 && me2.json?.email === EMAIL, me2.json);
  } else {
    ok('GET /me (post-refresh) skipped', false);
  }

  console.log('\nLogout');
  if (newRefreshToken) {
    const logout = await req('POST', '/api/v1/auth/logout', { refreshToken: newRefreshToken });
    ok('POST /auth/logout -> 204', logout.status === 204, logout.json);

    const refreshAfterLogout = await req('POST', '/api/v1/auth/refresh', { refreshToken: newRefreshToken });
    ok(
      'POST /auth/refresh with revoked token -> 401',
      refreshAfterLogout.status === 401,
      refreshAfterLogout.json,
    );
  } else {
    ok('Logout flow skipped (no refresh token)', false);
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
