import type { StoreId } from '../types/game'

/**
 * Per-game official product pages verified against the corresponding retailer.
 * A verified link DOES NOT imply that the retailer's Indonesian price is available.
 * Never substitute a search page, wishlist, or another edition for a product page.
 */
const verifiedPages: Record<string, Partial<Record<StoreId, string>>> = {
  'battlefield-6': {
    steam: 'https://store.steampowered.com/app/2807960/?cc=id',
    epic: 'https://store.epicgames.com/p/battlefield-6',
  },
  'detroit-become-human': {
    steam: 'https://store.steampowered.com/app/1222140/?cc=id',
    epic: 'https://store.epicgames.com/p/detroit-become-human',
  },
  'sekiro-shadows-die-twice': {
    steam: 'https://store.steampowered.com/app/814380/?cc=id',
  },
  'red-dead-redemption-2': {
    steam: 'https://store.steampowered.com/app/1174180/?cc=id',
    epic: 'https://store.epicgames.com/p/red-dead-redemption-2',
  },
}

export function verifiedStoreUrl(gameId: string, store: StoreId): string | null {
  return verifiedPages[gameId]?.[store] ?? null
}
