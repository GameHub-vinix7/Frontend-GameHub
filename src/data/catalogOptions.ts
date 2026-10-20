export const SHOPS = ['steam', 'epic', 'gog'] as const
export type ShopFilter = (typeof SHOPS)[number]

export function isStoreCatalogId(value: string | undefined): value is ShopFilter {
  return SHOPS.some((store) => store === value)
}

export const GENRES = [
  'Action',
  'Rpg',
  'Adventure',
  'Strategy',
  'Simulation',
  'Racing',
  'Sports',
  'Indie',
] as const
export type GenreFilter = (typeof GENRES)[number]
