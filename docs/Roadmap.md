# CLAY — Release Roadmap

## MVP (~25 dev days)

Offline-capable single-user app. No backend required.

| Phase | Feature | Effort |
|---|---|---|
| 1 | Monorepo restructure | 2d |
| 2 | Architecture foundation (Zustand, React Query, Zod) | 3d |
| 3 | Offline schema + SyncEngine skeleton | 5d |
| 4 | Inventory management | 8d |
| 5 | Shopping list rewrite | 6d |
| 7 | Barcode scanner | 4d |

## V1 (~20 additional dev days)

Adds backend, authentication, cross-device sync, and price comparison.

| Phase | Feature | Effort |
|---|---|---|
| 6 | Price comparison module | 6d |
| 8 | Backend (Fastify + PostgreSQL + auth + sync) | 6d |
| 9 | Performance optimization | 3d |
| — | Integration + QA | 5d |

## V2 (~30 additional dev days)

| Feature |
|---|
| Household / family list sharing |
| Push notifications (low-stock, expiry) |
| Receipt scanning (OCR → auto-update prices) |
| Spending analytics |

## Future

- AI shopping list suggestions
- Grocery delivery API integrations
- Apple Watch glance
