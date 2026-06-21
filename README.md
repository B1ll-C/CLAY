# CLAY

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

## Documentation

| Doc | Description |
|---|---|
| [docs/Architecture.md](docs/Architecture.md) | System architecture overview |
| [docs/PRD.md](docs/PRD.md) | Product requirements |
| [docs/BRD.md](docs/BRD.md) | Business requirements |
| [docs/Roadmap.md](docs/Roadmap.md) | MVP / V1 / V2 release plan |
| [docs/OfflineStrategy.md](docs/OfflineStrategy.md) | Offline-first approach |
| [docs/SyncEngine.md](docs/SyncEngine.md) | Sync architecture |
| [CLAUDE.md](CLAUDE.md) | Claude Code guide |
| [Design.md](Design.md) | Design system |
