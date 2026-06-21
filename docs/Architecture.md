# CLAY — Architecture

## Monorepo Structure

```
/
├── mobile/       Expo 53 + React Native 0.79.6
├── backend/      Fastify + PostgreSQL + Drizzle (scaffold; full API Phase 8)
├── shared/       Types, constants, Zod validation (used by both)
└── docs/
```

## Mobile Stack

| Concern | Choice |
|---|---|
| Framework | Expo 53 / React Native 0.79.6 |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind) |
| Local DB | expo-sqlite + Drizzle ORM |
| State (UI) | Zustand |
| State (server) | TanStack Query v5 |
| Validation | Zod via @clay/shared |
| Auth tokens | expo-secure-store (Phase 8) |

### Phase 2 wiring

- `mobile/lib/queryClient.ts` — shared `QueryClient`; `QueryClientProvider` wraps the root layout in `app/_layout.tsx`
- `mobile/store/uiStore.ts` — Zustand store for UI-only state (modals, active selections, filters)
- `mobile/hooks/` — React Query hooks (e.g. `useShoppingLists`)
- `shared/validation/schemas.ts` — Zod schemas shared between mobile forms and backend request bodies

## Backend Stack

The Fastify + PostgreSQL + Drizzle scaffold landed in Phase 2: the Drizzle/Postgres
connection (`backend/src/db/`), a migration runner (`npm run db:migrate`), and the
`/health` + `/health/db` routes. The server boots without a live database; point
`DATABASE_URL` at Postgres to enable the DB-health check and queries. Auth, Redis,
BullMQ, and Pino logging arrive in Phase 8.

| Concern | Choice | Status |
|---|---|---|
| Framework | Fastify v5 | ✅ Phase 2 |
| Database | PostgreSQL + Drizzle ORM | ✅ Phase 2 (connection + migrations) |
| Cache | Redis | Phase 8 |
| Auth | JWT (15m access / 30d refresh) | Phase 8 |
| Jobs | BullMQ | Phase 8 |
| Logging | Pino | Phase 8 |

## Data Flow

```
UI (Expo Router screens)
  ↓ hooks
React Query (server state cache)
  ↓ offline            ↓ online
SQLite (Drizzle)    Backend API (Fastify)
  ↓                     ↓
SyncEngine ←──────────────
```

## Offline Strategy

All reads and writes go to SQLite first. The SyncEngine pushes pending changes
to the backend when connectivity is restored. See OfflineStrategy.md.
