# QA Checklist — Per Feature

Run these checks before merging any feature PR.

## Offline / Connectivity
- [ ] Works with airplane mode enabled from the start
- [ ] Works with airplane mode toggled mid-session
- [ ] Data persists across app kill and relaunch
- [ ] Sync queue drains correctly after airplane mode is disabled
- [ ] Sync status indicator updates after successful sync

## Data Integrity
- [ ] Deleting a list also deletes its items (cascade verified)
- [ ] Soft-deleted records do not appear in UI
- [ ] Duplicate barcode scan does not create a second product record
- [ ] Drizzle migration runs cleanly on fresh install (no existing DB)
- [ ] Drizzle migration runs cleanly on upgrade (existing DB with prior schema)

## Inventory
- [ ] Low-stock alert appears when quantity drops to or below `min_quantity`
- [ ] Expiry alert appears when `expiration_date` is within 7 days
- [ ] Expired alert appears when `expiration_date` is in the past
- [ ] Out-of-stock state shown when `quantity <= 0`
- [ ] Stock movement is logged on every quantity change

## Shopping Lists
- [ ] Creating a list and immediately killing the app — list is still there on relaunch
- [ ] Checking an item updates the DB (not just local state)
- [ ] "Add low-stock items" correctly pulls from inventory alerts
- [ ] List deletion removes all child items

## Barcode Scanner
- [ ] Scan finds product already in local DB (no network call)
- [ ] Scan finds product via API when not in local DB (online)
- [ ] Scan gracefully handles unknown barcode (offline): creates skeleton product
- [ ] Scanning same barcode twice — no duplicate created
- [ ] Camera permission prompt appears on first scan

## Platform
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Empty states are displayed (no items, no lists, no prices)
- [ ] No console errors or warnings in dev mode

## Auth (Phase 8+)
- [ ] JWT expiry is handled gracefully (auto-refresh, not logout)
- [ ] Logout clears tokens from SecureStore
- [ ] Protected routes redirect to login when unauthenticated
