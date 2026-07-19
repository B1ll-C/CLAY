import { alertCounts, alertStatuses, matchesFilter } from "./alerts";

const NOW = new Date("2026-01-15T00:00:00.000Z");

describe("alertStatuses", () => {
  it("flags out_of_stock at zero quantity, taking priority over low_stock", () => {
    const statuses = alertStatuses(
      { quantity: 0, minQuantity: 5, expirationDate: null },
      NOW,
    );
    expect(statuses).toEqual(["out_of_stock"]);
  });

  it("flags low_stock when quantity is at or below minQuantity", () => {
    const statuses = alertStatuses(
      { quantity: 2, minQuantity: 2, expirationDate: null },
      NOW,
    );
    expect(statuses).toEqual(["low_stock"]);
  });

  it("is ok when quantity is above minQuantity and there's no expiration", () => {
    const statuses = alertStatuses(
      { quantity: 10, minQuantity: 2, expirationDate: null },
      NOW,
    );
    expect(statuses).toEqual([]);
  });

  it("flags expired for a past expirationDate", () => {
    const statuses = alertStatuses(
      {
        quantity: 10,
        minQuantity: null,
        expirationDate: new Date("2026-01-01T00:00:00.000Z"),
      },
      NOW,
    );
    expect(statuses).toContain("expired");
  });

  it("can combine low_stock and expiring_soon on the same item", () => {
    const statuses = alertStatuses(
      {
        quantity: 1,
        minQuantity: 3,
        expirationDate: new Date("2026-01-16T00:00:00.000Z"),
      },
      NOW,
    );
    expect(statuses).toEqual(expect.arrayContaining(["low_stock", "expiring_soon"]));
  });
});

describe("matchesFilter", () => {
  const item = { quantity: 0, minQuantity: null, expirationDate: null };

  it("matches everything under the 'all' filter", () => {
    expect(matchesFilter(item, "all", NOW)).toBe(true);
  });

  it("only matches a specific filter when that alert applies", () => {
    expect(matchesFilter(item, "out_of_stock", NOW)).toBe(true);
    expect(matchesFilter(item, "expired", NOW)).toBe(false);
  });
});

describe("alertCounts", () => {
  it("tallies each alert category across a list of items", () => {
    const counts = alertCounts(
      [
        { quantity: 0, minQuantity: null, expirationDate: null },
        { quantity: 1, minQuantity: 5, expirationDate: null },
        { quantity: 10, minQuantity: null, expirationDate: null },
      ],
      NOW,
    );
    expect(counts).toEqual({
      out_of_stock: 1,
      low_stock: 1,
      expired: 0,
      expiring_soon: 0,
    });
  });
});
