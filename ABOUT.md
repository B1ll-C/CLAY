# About CLAY

## What it is

CLAY is an offline-first grocery and inventory management app for individuals and
families. You track what's in your kitchen, keep shopping lists in sync with that
inventory, scan barcodes to add items quickly, and compare prices across stores — all of
it usable with no internet connection, syncing quietly in the background whenever a
connection becomes available.

It's built with Expo / React Native for iOS and Android, with a Node.js backend for
account sync across devices.

## The problem it solves

Grocery shopping and kitchen management have a few recurring pain points this app is
built around:

- **Food waste** — items go bad in the back of the fridge or pantry because nobody
  tracked when they were bought or when they expire.
- **Duplicate purchases** — you buy something you already have because there's no
  reliable, up-to-date view of what's actually on hand.
- **Overspending** — the same grocery list costs different amounts at different stores,
  but comparing prices by memory or receipt is impractical.
- **Poor connectivity where it matters most** — grocery stores and basements are
  notorious dead zones, and a shopping app that requires a live connection to function
  is a shopping app that fails you at checkout.

## Who it's for

- Home cooks who want an accurate, low-effort view of pantry and fridge stock
- Families coordinating a shared shopping list across multiple people/devices
- Budget-conscious shoppers who want to know which store is actually cheaper before they go

## Core features

- **Inventory tracking** — a running record of what you have, with quantities, expiry
  dates, and an append-only movement log (every add/consume/adjust is recorded, not just
  the current count). Smart alerts surface items that are low-stock, expiring soon, or
  already out.
- **Shopping lists** — multiple named lists, freeform or checkable items, bulk
  check/clear, and a one-tap "add all low-stock items" action that pulls straight from
  the inventory alerts above — so the list and the pantry stay in sync instead of
  drifting apart.
- **Barcode scanning** — point the camera at a product to look it up and add it straight
  to inventory or a list. Known barcodes resolve instantly from a local catalog; unknown
  ones fall back to the (free, public) Open Food Facts database so the catalog grows on
  its own as you scan.
- **Price comparison** — track a product's price at each store you shop, compare
  side-by-side, and get a "cheapest basket" recommendation that optimizes either total
  cost or fewest store trips.
- **Offline-first sync** — every piece of data is written to local SQLite first and
  works fully offline. A background sync engine pushes and pulls changes against the
  backend when connectivity is available, with conflict resolution, so switching between
  devices or losing signal never means losing data.

## Design philosophy

Two decisions shape almost everything else in the app:

1. **Offline is the default, not a fallback.** The app is designed and built
   local-first — every read and write hits SQLite immediately, and the network is an
   optional accelerant for sync, not a dependency for basic function.
2. **Inventory and shopping lists are one system, not two.** Instead of treating
   "what I need to buy" and "what I have" as separate, disconnected features, low-stock
   alerts feed directly into shopping-list restocking, so the two stay reconciled with
   minimal manual upkeep.

## Where this fits in the roadmap

CLAY is being built in phases (see `docs/Roadmap.md`):

- **MVP** — a fully offline, single-user app: inventory, shopping lists, and barcode
  scanning, no backend required.
- **V1** *(current)* — adds the backend: authentication, cross-device sync, and price
  comparison.
- **V2** *(planned)* — household/family list sharing, push notifications for low-stock
  and expiry, receipt-scanning OCR to auto-update prices, and spending analytics.

For the technical setup, see [SETUP.md](SETUP.md). For architecture details, see
`docs/Architecture.md`, `docs/PRD.md`, and `docs/BRD.md`.
