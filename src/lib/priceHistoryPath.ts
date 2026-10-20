import type { StoreId } from '../types/game'

const STORE_PLATFORM: Readonly<Record<StoreId, string>> = {
  steam: 'Steam',
  epic: 'Epic Games',
  gog: 'GOG',
}

export function preferredHistoryStore(stores: readonly StoreId[]): StoreId {
  if (stores.includes('gog')) return 'gog'
  if (stores.includes('steam')) return 'steam'
  if (stores.includes('epic')) return 'epic'
  return 'steam'
}

export function platformNameForHistory(store: StoreId): string {
  return STORE_PLATFORM[store]
}

export function priceHistoryPath(gameId: string, store: StoreId): string {
  return `/games/${encodeURIComponent(gameId)}/price-history?platform=${encodeURIComponent(platformNameForHistory(store))}`
}
