import type { BackendGame } from './backendApi'
import type { GameCardData } from '../types/game'

/**
 * Pin the four familiar Epic game covers without inventing a store offer.
 * Only an actual Epic offer from Laravel can supply a price or discount.
 * Static-only references never link to a nonexistent backend detail.
 */
export function withEpicShowcase(
  backendGames: readonly BackendGame[],
  offers: readonly GameCardData[],
  references: readonly GameCardData[],
): GameCardData[] {
  const backendById = new Map(backendGames.map((game) => [game.slug, game]))
  const epicOffers = new Map(offers.filter((offer) => offer.store === 'epic').map((offer) => [offer.id, offer]))

  const featured: GameCardData[] = references.map((reference) => {
    const epicOffer = epicOffers.get(reference.id)
    if (epicOffer) return epicOffer

    const game = backendById.get(reference.id)
    return {
      id: reference.id,
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
