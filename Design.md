# CLAY — Design System

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#8FB996` | Sage green — primary actions, active states |
| `primary-dark` | `#557C55` | Olive — pressed states, headers |
| `primary-light` | `#E6F4EA` | Mint cream — backgrounds, cards |
| `accent-peach` | `#F7C8A0` | Warnings, highlights |
| `accent-mustard` | `#E6C368` | Badges, prices |
| `neutral-white` | `#FFFFFF` | Card surfaces |
| `neutral-light` | `#F1F1F1` | Page backgrounds |
| `neutral-gray` | `#9CA3AF` | Secondary text, borders |
| `neutral-dark` | `#374151` | Primary text |

## Typography

Font: SpaceMono-Regular (loaded via expo-font)

## Component Patterns

### Cards
- Rounded corners: `rounded-2xl`
- Background: `bg-neutral-white` or `bg-primary-light`
- Padding: `p-4`
- Shadow: `shadow-sm`

### Badges
- Low stock: yellow background, dark text
- Expiring soon: orange/peach background
- Out of stock: gray, muted

### Buttons
- Primary: `bg-primary rounded-xl px-6 py-3`
- Destructive: `bg-red-500 rounded-xl`

## Navigation

Tab bar uses Expo Router bottom tabs. Three primary tabs:
1. Groceries (product catalog)
2. List (shopping lists)
3. Inventory

Hidden tab: ProductDetails (accessed via deep link from product cards).
