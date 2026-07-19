import { describe, expect, it } from 'vitest';

import { SYNC_TABLE_REGISTRY } from '../db/syncTableRegistry.js';
import { coercePayloadForDb, coerceRowForWire } from './SyncService.js';

describe('coercePayloadForDb', () => {
  const inventoryEntry = SYNC_TABLE_REGISTRY.inventory_items;

  it('drops any key not in the table\'s column whitelist', () => {
    const values = coercePayloadForDb(inventoryEntry, {
      productId: 1,
      quantity: 2,
      userId: 'attacker-supplied-id',
      version: 999,
    });

    expect(values).not.toHaveProperty('userId');
    expect(values).not.toHaveProperty('version');
    expect(values).toEqual({ productId: 1, quantity: 2 });
  });

  it('converts a wire unix-seconds number to a Date for date columns', () => {
    const values = coercePayloadForDb(inventoryEntry, {
      expirationDate: 1_700_000_000,
    });

    expect(values.expirationDate).toBeInstanceOf(Date);
    expect((values.expirationDate as Date).getTime()).toBe(1_700_000_000 * 1000);
  });

  it('treats a non-number date column value as null rather than an Invalid Date', () => {
    const values = coercePayloadForDb(inventoryEntry, { expirationDate: null });
    expect(values.expirationDate).toBeNull();
  });
});

describe('coerceRowForWire', () => {
  const inventoryEntry = SYNC_TABLE_REGISTRY.inventory_items;

  it('converts a Date column back to unix seconds', () => {
    const data = coerceRowForWire(inventoryEntry, {
      productId: 1,
      quantity: 2,
      expirationDate: new Date(1_700_000_000 * 1000),
    });

    expect(data.expirationDate).toBe(1_700_000_000);
  });

  it('defaults a missing whitelisted column to null instead of undefined', () => {
    const data = coerceRowForWire(inventoryEntry, { productId: 1, quantity: 2 });
    expect(data.expirationDate).toBeNull();
  });
});
