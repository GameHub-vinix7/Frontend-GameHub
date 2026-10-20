import type { GameCardData, StoreId } from '../types/game'

export type BackendOffer = {
  platform?: string
  original_price?: number | string | null
  discount_percentage?: number | string | null
  final_price?: number | string | null
  currency?: string | null
  store_url?: string | null
  updated_at?: string | null
}

export type BackendSystemRequirement = {
  platform?: string
  type?: string
  operating_system?: string | null
  processor?: string | null
  memory?: string | null
  graphics?: string | null
  network?: string | null
  storage?: string | null
  sound_card?: string | null
  other?: string | null
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
  system_requirements?: BackendSystemRequirement[]
}

const PLATFORM_TO_STORE: Readonly<Record<string, StoreId>> = {
  steam: 'steam',
  'epic games': 'epic',
  gog: 'gog',
}

/** Only an explicit IDR amount is a usable price for this catalog. */
function toIdrPrice(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}

function toStoreUrl(value: string | null | undefined): string | undefined {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : undefined
}

/**
 * Maps one backend game resource into one card per storefront offer.
 *
 * The backend is the single source of truth: identity comes from the game
 * resource, while price, discount and store link come from each offer. An
 * offer without a verified IDR price is still rendered so the UI can say the
 * price is unavailable instead of hiding the storefront or inventing a value.
 */
export function mapBackendGame(game: BackendGame): GameCardData[] {
  if (!game || typeof game.slug !== 'string' || !Array.isArray(game.offers)) return []

  const genres = typeof game.genre === 'string' && game.genre.trim() ? [game.genre.trim()] : []

  return game.offers.flatMap((offer) => {
    const store = typeof offer.platform === 'string'
      ? PLATFORM_TO_STORE[offer.platform.trim().toLowerCase()]
      : undefined
    if (!store) return []

    const currency = typeof offer.currency === 'string' ? offer.currency.trim().toUpperCase() : null
    const currentPrice = currency === 'IDR' ? toIdrPrice(offer.final_price) : null
    const rawOriginal = currency === 'IDR' ? toIdrPrice(offer.original_price) : null
    const originalPrice = currentPrice !== null && rawOriginal !== null && rawOriginal >= currentPrice
      ? rawOriginal
      : currentPrice

    return [{
      id: game.slug,
      title: game.title,
      coverSrc: typeof game.cover_image === 'string' && game.cover_image ? game.cover_image : '',
      store,
      originalPrice,
      currentPrice,
      currency: currentPrice !== null ? 'IDR' as const : undefined,
      dealUrl: toStoreUrl(offer.store_url),
      priceUpdatedAt: offer.updated_at ?? game.last_synced_at ?? undefined,
      rating: null,
      genres,
      description: game.description ?? null,
    }]
  })
}

export function mapBackendGames(games: BackendGame[]): GameCardData[] {
  return games.flatMap(mapBackendGame)
}

/**
 * Adds an Epic Games Store card for every backend game that has no Epic offer.
 *
 * The catalog is store-agnostic: the same game identity can be browsed under
 * Epic even when the backend has no verified Epic price yet. Such a card keeps
 * the API identity and shows an unavailable price instead of a demo value.
 * Games that already have a real Epic offer are never duplicated.
 */
export function addEpicStorefrontCards(games: BackendGame[], cards: GameCardData[]): GameCardData[] {
  const epicIds = new Set(cards.filter((card) => card.store === 'epic').map((card) => card.id))
  const identityCards = games.flatMap((game) => {
    if (!game || typeof game.slug !== 'string' || !game.title || epicIds.has(game.slug)) return []
    const genres = typeof game.genre === 'string' && game.genre.trim() ? [game.genre.trim()] : []
    return [{
      id: game.slug,
      title: game.title,
      coverSrc: typeof game.cover_image === 'string' ? game.cover_image : '',
      store: 'epic' as const,
      originalPrice: null,
      currentPrice: null,
      rating: null,
      genres,
      description: game.description ?? null,
    }]
  })
  return [...cards, ...identityCards]
}

export type RequirementSpec = { label: string; value: string }

const REQUIREMENT_FIELDS: ReadonlyArray<[string, keyof BackendSystemRequirement]> = [
  ['OS', 'operating_system'],
  ['Prosesor', 'processor'],
  ['Memori', 'memory'],
  ['Grafis', 'graphics'],
  ['Jaringan', 'network'],
  ['Penyimpanan', 'storage'],
  ['Kartu suara', 'sound_card'],
  ['Lainnya', 'other'],
]

/** Converts backend system requirements into labelled specs, skipping empty fields. */
export function mapSystemRequirements(
  requirements: BackendSystemRequirement[] | null | undefined,
  type: 'minimum' | 'recommended',
): RequirementSpec[] {
  return (requirements ?? [])
    .filter((requirement) => requirement.type === type)
    .flatMap((requirement) => REQUIREMENT_FIELDS.flatMap(([label, field]) => {
      const value = requirement[field]
      const platform = typeof requirement.platform === 'string' ? requirement.platform.trim() : ''
      return typeof value === 'string' && value.trim()
        ? [{ label: platform ? `${platform} · ${label}` : label, value }]
        : []
    }))
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
