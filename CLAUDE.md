# CLAY — Claude Code Guide

## Monorepo Structure

```
/
├── mobile/       Expo React Native app (primary development target)
├── backend/      Node.js Fastify API (Phase 8+)
├── shared/       Shared types, constants, Zod validation
├── docs/         Architecture, PRD, BRD, roadmap
├── CLAUDE.md     ← you are here
└── Design.md     Design system reference
```

All Claude-facing documents (CLAUDE.md, Design.md, PRINCIPLES.md) live at the **repository root**.

## Working in mobile/

Commands run from `mobile/`:
```bash
npx expo start          # start dev server
npx expo run:android    # run on Android
npx tsc --noEmit        # type-check
npx drizzle-kit generate  # generate migrations after schema changes
```

Or from the workspace root:
```bash
npm run start           # proxies to mobile/ expo start
npm run android         # proxies to mobile/ expo run:android
```

## Path Aliases

The `@/*` alias inside `mobile/` maps to `mobile/` itself.

```typescript
import { db } from '@/models/db';          // mobile/models/db.ts
import { ShoppingList } from '@/types/shopping'; // mobile/types/shopping.ts
```

Shared package imports (Phase 2+):
```typescript
import { ProductCategory } from '@clay/shared/constants/categories';
```

## Key Files

| File | Purpose |
|---|---|
| `mobile/app/_layout.tsx` | Root layout — SQLite init, Drizzle migrations, providers |
| `mobile/models/db.ts` | Drizzle ORM + expo-sqlite instance |
| `mobile/models/index.ts` | Schema exports (used by drizzle.config.ts) |
| `mobile/controller/ShoppingListController.ts` | DB operations for shopping lists |
| `mobile/drizzle/` | Generated migration files — do not edit manually |
| `backend/src/index.ts` | Fastify server entry point |
| `shared/types/shopping.ts` | Shared TypeScript types |

## Database

- Local: SQLite via `expo-sqlite` + `drizzle-orm`
- After any schema change in `mobile/models/`: run `npx drizzle-kit generate` from `mobile/`
- Migrations run automatically in `app/_layout.tsx` via `useMigrations`
- All tables include sync columns: `sync_status`, `server_id`, `version` (Phase 3+)

## Design System

Color palette (sage green theme):
- Primary: `#8FB996` (sage green)
- Primary dark: `#557C55` (olive)
- Primary light: `#E6F4EA` (mint cream)
- Accent peach: `#F7C8A0`
- Accent mustard: `#E6C368`

See `mobile/tailwind.config.js` for full theme. Use NativeWind Tailwind classes in all components.

## Current State (Phase 2 complete)

- ✅ Monorepo structure
- ✅ SQLite + Drizzle ORM foundation
- ✅ State management — Zustand (UI state, `mobile/store/`) + TanStack Query v5 (`mobile/lib/queryClient.ts`, `mobile/hooks/`)
- ✅ Zod validation schemas in `shared/validation/schemas.ts` (`@clay/shared`)
- ✅ Backend scaffold — Fastify + Drizzle + Postgres connection, `/health` + `/health/db`, migration runner
- ✅ Shopping list UI (partial — not fully DB-backed)
- ✅ Tab navigation (Groceries, List, Inventory)
- 🔄 Inventory tab — empty placeholder
- 🔄 Product data — hardcoded
- ❌ Backend API (auth, sync, feature routes) — not yet (Phase 8)
- ❌ Auth, sync engine — not yet (Phase 3 / Phase 8)

## Phase Checklist

See `docs/Roadmap.md` for the full release plan.
