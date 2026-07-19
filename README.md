# CLAY

[![CI](https://github.com/B1ll-C/CLAY/actions/workflows/ci.yml/badge.svg)](https://github.com/B1ll-C/CLAY/actions/workflows/ci.yml)

Offline-first grocery and inventory management app for iOS and Android.

## Monorepo Structure

```
/
├── mobile/       Expo React Native app
├── backend/      Node.js Fastify API (Phase 8)
├── shared/       Shared types, constants, validation
├── docs/         Architecture and product docs
├── CLAUDE.md     Claude Code project guide
└── Design.md     Design system
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- Expo CLI: `npm install -g expo-cli`
- Android Studio or Xcode (for device simulators)

### Install

```bash
# From the workspace root
npm install
```

### Run the mobile app

```bash
# From workspace root
npm run start

# Or from mobile/
cd mobile && npx expo start
```

### Run the backend (Phase 8+)

```bash
npm run backend:dev
```

For the full walkthrough — Docker Postgres/Redis, `.env` values, native rebuilds, troubleshooting — see [SETUP.md](SETUP.md).

## Testing

| Layer | Where | Run |
|---|---|---|
| Mobile unit | `mobile/**/*.test.ts(x)` (Jest + `jest-expo` + RNTL) | `npm test --workspace=mobile` |
| Backend unit + integration | `backend/src/**/*.test.ts` (Vitest) | `npm test --workspace=backend` |
| Mobile E2E | `mobile/.maestro/*.yaml` (Maestro) | `npm run test:e2e --workspace=mobile` |

Every push and pull request into `main`/`develop` runs lint, type-check, and the mobile + backend test suites via GitHub Actions (`.github/workflows/ci.yml`). Merging a PR into `develop` also auto-opens a versioned release PR into `main` (`.github/workflows/release-branch.yml`) for manual review. See `CLAUDE.md`'s Testing section for the coverage policy (what needs a test and at which layer).

## Documentation

| Doc | Description |
|---|---|
| [SETUP.md](SETUP.md) | Full local setup guide — prerequisites, `.env` values, troubleshooting |
| [ABOUT.md](ABOUT.md) | What CLAY is and the problem it solves |
| [docs/Architecture.md](docs/Architecture.md) | System architecture overview |
| [docs/PRD.md](docs/PRD.md) | Product requirements |
| [docs/BRD.md](docs/BRD.md) | Business requirements |
| [docs/Roadmap.md](docs/Roadmap.md) | MVP / V1 / V2 release plan |
| [docs/Phases.md](docs/Phases.md) | Phase-by-phase build plan |
| [docs/OfflineStrategy.md](docs/OfflineStrategy.md) | Offline-first approach |
| [docs/SyncEngine.md](docs/SyncEngine.md) | Sync architecture |
| [docs/Supabase.md](docs/Supabase.md) | Supabase-backed auth/Postgres (`feat/supabase-backend`) |
| [docs/BuildAPK.md](docs/BuildAPK.md) | Building a release APK |
| [docs/Checklists/](docs/Checklists) | QA / technical / migration checklists |
| [CLAUDE.md](CLAUDE.md) | Claude Code guide |
| [Design.md](Design.md) | Design system |
