export const PRODUCT_CATEGORIES = [
  'Produce',
  'Dairy',
  'Meat & Seafood',
  'Pantry',
  'Frozen',
  'Beverages',
  'Household',
  'Personal Care',
  'Other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
