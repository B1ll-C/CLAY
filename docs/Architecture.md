# CLAY — Architecture

## Monorepo Structure

```
/
├── mobile/       Expo 53 + React Native 0.79.6
├── backend/      Fastify + Node.js + PostgreSQL (Phase 8)
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
| State (UI) | Zustand (Phase 2) |
| State (server) | TanStack Query v5 (Phase 2) |
| Validation | Zod via @clay/shared (Phase 2) |
| Auth tokens | expo-secure-store (Phase 8) |

## Backend Stack (Phase 8)

| Concern | Choice |
|---|---|
| Framework | Fastify v5 |
| Database | PostgreSQL + Drizzle ORM |
| Cache | Redis |
| Auth | JWT (15m access / 30d refresh) |
| Jobs | BullMQ |
| Logging | Pino |

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
