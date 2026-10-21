import type { BackendGame } from './backendApi'
import type { GameCardData } from '../types/game'

/**
 * Pin the four familiar Epic game covers without inventing a store offer.
 * Only an actual Epic offer from Laravel can supply a price or discount.
 * Reference-only games use bundled detail media without requesting a nonexistent backend detail.
 */
export function withEpicShowcase(
  backendGames: readonly BackendGame[],
  offers: readonly GameCardData[],
  references: readonly GameCardData[],
): GameCardData[] {
  const backendById = new Map(backendGames.map((game) => [game.slug, game]))
  const backendByTitle = new Map<string, BackendGame>()
  const ambiguousTitles = new Set<string>()
  for (const game of backendGames) {
    if (!game || typeof game.title !== 'string' || typeof game.slug !== 'string') continue
    const title = game.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (!title) continue
    if (backendByTitle.has(title)) ambiguousTitles.add(title)
    else backendByTitle.set(title, game)
  }
  const epicOffers = new Map(offers.filter((offer) => offer.store === 'epic').map((offer) => [offer.id, offer]))

  const featured: GameCardData[] = references.map((reference) => {
    const title = reference.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    // Only adopt a distinct real Laravel identity; never guess among editions.
    const game = backendById.get(reference.id)
      ?? (title && !ambiguousTitles.has(title) ? backendByTitle.get(title) : undefined)
    const gameId = game?.slug ?? reference.id
    const epicOffer = epicOffers.get(gameId)
    if (epicOffer) return epicOffer

    return {
      id: gameId,
      title: game?.title || reference.title,
      coverSrc: reference.coverSrc,
      store: 'epic',
      originalPrice: null,
      currentPrice: null,
      rating: null,
      genres: game?.genre ? [game.genre] : reference.genres,
      description: game?.description ?? null,
      previewOnly: !game,
    }
  })

  const featuredIds = new Set(featured.map((game) => game.id))
  return [
    ...offers.filter((offer) => offer.store !== 'epic'),
    ...featured,
    ...offers.filter((offer) => offer.store === 'epic' && !featuredIds.has(offer.id)),
  ]
}

/** Identifies cards with bundled media only; never request a nonexistent backend detail. */
export function isReferenceOnlyGame(cards: readonly GameCardData[]): boolean {
  return cards.length > 0 && cards.every((card) => card.previewOnly === true)
}
