# CLAY — Local Setup Guide

Step-by-step instructions for getting the full CLAY stack (mobile app + backend API +
Postgres/Redis) running on a fresh machine, including exactly where every `.env` value
comes from.

For a description of what CLAY is and why it exists, see [ABOUT.md](ABOUT.md).

CLAY is a monorepo:

```
/
├── mobile/    Expo React Native app (SQLite, offline-first)
├── backend/   Node.js Fastify API (Postgres, Redis, BullMQ)
├── shared/    Shared TypeScript types + Zod validation (@clay/shared)
└── docs/      Architecture / product docs
```

You do **not** need the backend running to use the mobile app — it works fully offline
against local SQLite. You only need the backend if you want to test auth, cross-device
sync, or the barcode remote-lookup fallback (Phase 8 features).

---

## 1. Prerequisites

| Tool | Version | Why | Get it |
|---|---|---|---|
| Node.js | 20+ | Runs both `mobile/` (Metro) and `backend/` (Fastify via `tsx`) | https://nodejs.org (or `nvm install 20`) |
| npm | 9+ | Workspace installs (`npm install` at repo root uses npm workspaces) | Bundled with Node |
| Git | any recent | Clone the repo | https://git-scm.com |
| Docker Desktop | any recent | Runs Postgres 16 + Redis 7 for the backend via `docker-compose.yml` | https://www.docker.com/products/docker-desktop |
| Expo CLI | via `npx`, no global install required | Runs the mobile dev server | Installed automatically by `npx expo` |
| Android Studio | latest | Android emulator + SDK — **required** for the barcode scanner, which needs a native rebuild | https://developer.android.com/studio |
| Xcode (macOS only) | latest | iOS simulator, if targeting iOS | Mac App Store |

Optional but recommended:
- A physical Android/iOS device with the **Expo Go** app, for testing without a full native build (note: Expo Go can't run the camera-scan flow — see §5).

You do **not** need to install PostgreSQL or Redis natively — they run in Docker containers defined in `backend/docker-compose.yml`.

---

## 2. Clone and install dependencies

```bash
git clone <repo-url> clay
cd clay
npm install
```

This is an npm workspaces monorepo (`mobile`, `backend`, `shared` are all workspaces declared in the root `package.json`), so a single `npm install` at the repo root installs and links all three.

---

## 3. Backend setup

### 3.1 Start Postgres + Redis

```bash
cd backend
docker compose up -d
```

This starts two containers (see `backend/docker-compose.yml`):
- **postgres:16** — user `postgres`, password `postgres`, database `clay`, exposed on host port `5432`
- **redis:7** — exposed on host port `6379`

Verify they're healthy:

```bash
docker compose ps
```

Both should show `healthy`.

### 3.2 Create your backend `.env`

```bash
cp backend/.env.example backend/.env
```

`backend/.env.example` currently contains:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/clay
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-only-change-me
PORT=3000
POSTGRES_PORT=5432
REDIS_PORT=6379
```

Where each value comes from:

| Variable | Where it's used | How to get a real value |
|---|---|---|
| `DATABASE_URL` | `backend/src/db/index.ts`, `backend/src/db/migrate.ts` — Drizzle's Postgres connection | Default (`postgres://postgres:postgres@localhost:5432/clay`) matches the docker-compose credentials above exactly — **no change needed for local dev**. Only edit if you changed `POSTGRES_PORT` or are pointing at a non-Docker Postgres instance. |
| `REDIS_URL` | `backend/src/lib/redis.ts` — refresh-token store, barcode-lookup cache, BullMQ connection | Default matches docker-compose — no change needed locally. |
| `JWT_SECRET` | `backend/src/services/AuthService.ts` — signs/verifies access-token JWTs (HS256) | **Generate a real secret**, don't use the placeholder even locally if you'll test auth seriously: `openssl rand -base64 48` (Git Bash/WSL/macOS/Linux) or in PowerShell: `[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Max 256 }))`. Paste the output as the value. Any change invalidates all previously issued tokens. |
| `PORT` | `backend/src/index.ts` — Fastify listen port | `3000` is fine unless something else on your machine uses it. |
| `POSTGRES_PORT` / `REDIS_PORT` | `docker-compose.yml` only (host-side port mapping) | Only change if `5432`/`6379` are already taken on your machine — then update `DATABASE_URL`/`REDIS_URL` to match. |

No third-party API keys are required for the backend. The Open Food Facts barcode fallback (`backend/src/lib/openFoodFacts.ts`, used by `BarcodeService`) calls the free, keyless Open Food Facts public API — nothing to sign up for.

### 3.3 Run database migrations

```bash
cd backend
npm run db:migrate
```

This runs `backend/src/db/migrate.ts`, which applies everything in `backend/drizzle/` against `DATABASE_URL`. You should see `✅ Migrations applied.`

If you later change a schema file under `backend/src/db/schema/`, regenerate migrations first:

```bash
npm run db:generate
npm run db:migrate
```

### 3.4 Start the API server

```bash
cd backend
npm run dev
```

Or from the repo root:

```bash
npm run backend:dev
```

This runs `tsx watch src/index.ts`, which starts Fastify on `http://localhost:3000` (or your `PORT`).

Verify it's up:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/db
```

Both should return a healthy JSON response. `/health/db` specifically checks the Postgres connection.

### 3.5 (Optional) Start the background worker

The nightly soft-delete cleanup job (`backend/src/workers/CleanupWorker.ts`, purges rows older than 90 days) runs as a **separate process** from the HTTP server:

```bash
cd backend
npm run worker
```

Or from the repo root: `npm run backend:worker`. Not required for day-to-day API/mobile testing — only needed if you're testing the BullMQ cleanup flow itself.

### 3.6 Smoke-test auth

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

You should get back `{ "accessToken": "...", "refreshToken": "..." }`. That confirms `JWT_SECRET`, `DATABASE_URL`, and `REDIS_URL` are all correctly wired.

---

## 4. Mobile app setup

### 4.1 Create your mobile `.env`

```bash
cp mobile/.env.example mobile/.env
```

`mobile/.env.example` contains:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

| Variable | Where it's used | How to set it |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `mobile/lib/sync/` HTTP transport, auth calls — base URL of the backend from step 3 | **Depends on how you're running the app** (see table below). Expo/Metro auto-inlines any `EXPO_PUBLIC_*` variable — no plugin config needed. |

How to pick the right host for `EXPO_PUBLIC_API_URL`:

| Where the app runs | Value to use |
|---|---|
| Android emulator (AVD) | `http://10.0.2.2:3000` — the emulator's special alias for the host machine's `localhost` |
| iOS simulator (macOS) | `http://localhost:3000` — the simulator shares the host's network namespace |
| Physical device (Expo Go or dev build) | `http://<your-machine's-LAN-IP>:3000`, e.g. `http://192.168.1.20:3000` — find your IP with `ipconfig` (Windows, look for IPv4 Address) or `ifconfig`/`ip addr` (macOS/Linux). Your phone and computer must be on the same Wi-Fi network, and Windows Firewall may need to allow inbound connections on port 3000. |
| Web (`expo start --web`) | `http://localhost:3000` |

If you're only testing offline features (inventory, shopping lists, price comparison — everything works fully offline against local SQLite), you can leave the default value and skip running the backend entirely.

### 4.2 Start the dev server

```bash
cd mobile
npx expo start
```

Or from the repo root: `npm run start`.

This opens the Expo dev tools. From there:
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)
- Press `w` for web
- Scan the QR code with Expo Go on a physical device

### 4.3 SQLite migrations

Local SQLite migrations (Drizzle) run **automatically** on app start via `useMigrations` in `mobile/app/_layout.tsx` — you don't need to run anything manually. If you change a schema file under `mobile/models/`, regenerate the migration first:

```bash
cd mobile
npx drizzle-kit generate
```

Then just reload the app; the new migration is picked up on next launch.

### 4.4 Type-checking

```bash
cd mobile
npx tsc --noEmit
```

---

## 5. Native rebuild (required for the barcode scanner)

The barcode scanner (`mobile/app/scan/`, uses `expo-camera`) is a **native module** and will not work in the plain Expo Go app or web preview. To test it you need a native dev build:

```bash
cd mobile
npx expo run:android
```

(or `npx expo run:ios` on macOS with Xcode installed). This requires Android Studio's SDK/emulator (or Xcode) from §1 and will take longer the first time as it compiles the native project.

Everything else in the app (inventory, shopping lists, price comparison, auth/sync) runs fine in Expo Go without a native build.

---

## 6. Full local stack — quick reference

Once set up, day-to-day startup is three terminals:

```bash
# Terminal 1 — Postgres + Redis (only needed once per reboot; runs in background)
cd backend && docker compose up -d

# Terminal 2 — Backend API
cd backend && npm run dev

# Terminal 3 — Mobile app
cd mobile && npx expo start
```

Add a 4th terminal (`cd backend && npm run worker`) only if you're testing the nightly cleanup job.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `DATABASE_URL is not set — cannot run migrations` | `backend/.env` missing or not copied | `cp backend/.env.example backend/.env` |
| Backend `/health/db` fails | Docker containers not running or not healthy yet | `docker compose ps` in `backend/`; wait for `healthy`, or `docker compose up -d` again |
| Mobile app can't reach the backend | Wrong `EXPO_PUBLIC_API_URL` for your run target | See the host table in §4.1 — Android emulator specifically needs `10.0.2.2`, not `localhost` |
| Changing `.env` in `mobile/` has no effect | Metro caches env vars at bundler start | Fully stop and restart `npx expo start` (a hot reload isn't enough) |
| Barcode scanner does nothing / camera permission errors in Expo Go | Camera is a native module, unsupported in Expo Go | Run `npx expo run:android` (or `run:ios`) per §5 |
| `EMAIL_TAKEN` on register during testing | You already registered that email against your local Postgres | Use a different email, or reset the DB: `docker compose down -v && docker compose up -d && npm run db:migrate` (⚠️ this deletes all local backend data) |
| Port `5432`/`6379`/`3000` already in use | Another process on your machine is bound to it | Change `POSTGRES_PORT`/`REDIS_PORT`/`PORT` in `backend/.env` and update `DATABASE_URL`/`REDIS_URL` to match the new port |

---

## 8. Where things live (for reference)

| File | Purpose |
|---|---|
| `backend/.env.example` | Backend env template |
| `mobile/.env.example` | Mobile env template |
| `backend/docker-compose.yml` | Local Postgres 16 + Redis 7 |
| `backend/src/db/migrate.ts` | Standalone Postgres migration runner |
| `backend/src/services/AuthService.ts` | JWT access tokens + Redis opaque refresh tokens |
| `backend/src/services/BarcodeService.ts` | Barcode lookup: Redis cache → Postgres → Open Food Facts |
| `backend/src/workers/CleanupWorker.ts` | BullMQ nightly soft-delete purge (90-day retention) |
| `mobile/app/_layout.tsx` | SQLite init + auto-run Drizzle migrations |
| `mobile/models/db.ts` | Drizzle + expo-sqlite instance |
| `mobile/app.json` | Expo config — camera/SQLite native plugin config |

For architecture and phase-by-phase feature context, see `docs/Architecture.md`, `docs/Roadmap.md`, and the root `CLAUDE.md`.
