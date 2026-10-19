import type { GameCardData, StoreId } from '../types/game'

export type BackendOffer = {
  platform?: string
  original_price?: number | string | null
  final_price?: number | string | null
  currency?: string | null
  store_url?: string | null
}

export type BackendGame = {
  id?: number
  slug: string
  title: string
  description?: string | null
  genre?: string | null
  cover_image?: string | null
  release_date?: string | null
  popularity?: number | null
  last_synced_at?: string | null
  offers?: BackendOffer[]
  system_requirements?: Array<{
    type?: string
    operating_system?: string | null
    processor?: string | null
    memory?: string | null
    graphics?: string | null
    network?: string | null
    storage?: string | null
    sound_card?: string | null
  }>
}

const PLATFORM_TO_STORE: Readonly<Record<string, StoreId>> = {
  steam: 'steam',
  'epic games': 'epic',
  gog: 'gog',
}

export function mapBackendGame(game: BackendGame): GameCardData[] {
  if (!game || typeof game.slug !== 'string' || !Array.isArray(game.offers)) return []
  const genres = typeof game.genre === 'string' && game.genre.trim() ? [game.genre.trim()] : []
  return game.offers.flatMap((offer) => {
    const store = typeof offer.platform === 'string' ? PLATFORM_TO_STORE[offer.platform.toLowerCase()] : undefined
    if (!store) return []
    const currentPrice = Number(offer.final_price)
    const originalPrice = Number(offer.original_price)
    if (!Number.isFinite(currentPrice) || currentPrice < 0) return []
    const validOriginal = Number.isFinite(originalPrice) && originalPrice >= currentPrice ? originalPrice : currentPrice
    return [{
      id: game.slug,
      title: game.title,
      coverSrc: typeof game.cover_image === 'string' && game.cover_image ? game.cover_image : '',
      store,
      originalPrice: validOriginal,
      currentPrice,
      currency: offer.currency === 'IDR' ? 'IDR' as const : undefined,
      dealUrl: typeof offer.store_url === 'string' ? offer.store_url : undefined,
      priceUpdatedAt: game.last_synced_at ?? undefined,
      rating: null,
      genres,
      description: game.description ?? null,
    }]
  })
}

export function withEpicDemoFallback(liveGames: GameCardData[], demoGames: GameCardData[]): GameCardData[] {
  if (liveGames.some((game) => game.store === 'epic')) return liveGames
  return [...liveGames, ...demoGames.filter((game) => game.store === 'epic').map((game) => ({ ...game, isDemo: true }))]
}

export function mapBackendGames(games: BackendGame[]): GameCardData[] {
  return games.flatMap(mapBackendGame)
}

const configuredApiBase = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL
export const API_BASE = (configuredApiBase || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options)
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`GameHub API ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`)
  }
  return response.json() as Promise<T>
}

export function getClientId(): string {
  const key = 'gamehub:client-id:v1'
  try {
    const existing = window.localStorage.getItem(key)
    if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(key, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function clientHeaders(): Record<string, string> {
  return { 'X-Client-ID': getClientId() }
}
