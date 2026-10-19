import type { GenreFilter, ShopFilter } from '../data/catalogOptions'
import type { GameCardData, StoreId } from '../types/game'

export type CatalogSort = 'latest' | 'bestseller' | 'discount' | 'lowest'

export type CatalogCriteria = {
  shops: readonly ShopFilter[]
  genres: readonly GenreFilter[]
  query: string
  fixedStore?: StoreId
}

/**
 * A store route is limited to its store regardless of user-selected filters.
 * No remote requests or browser state are used by this function.
 */
export function filterCatalogGames(
  games: readonly GameCardData[],
  { shops, genres, query, fixedStore }: CatalogCriteria,
): GameCardData[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID')

  return games.filter((game) => {
    const matchesStore = fixedStore
      ? game.store === fixedStore
      : shops.length === 0 || shops.includes(game.store)
    const matchesGenre = genres.length === 0 || genres.some((genre) =>
      game.genres.some((item) => item.toLocaleLowerCase('id-ID') === genre.toLocaleLowerCase('id-ID')),
    )
    const storeLabel = game.store === 'steam' ? 'Steam' : game.store === 'epic' ? 'Epic Games Store' : game.store
    const searchable = [game.title, storeLabel, ...game.genres].join(' ').toLocaleLowerCase('id-ID')
    const matchesSearch = normalizedQuery.length === 0 || searchable.includes(normalizedQuery)

    return matchesStore && matchesGenre && matchesSearch
  })
}

/** Keeps the original array intact. "latest" currently means source order, not a verified release date. */
export function sortCatalogGames(
  games: readonly GameCardData[],
  sort: CatalogSort,
): GameCardData[] {
  const copy = [...games]
  if (sort === 'lowest') return copy.sort((a, b) => (a.currentPrice ?? Number.POSITIVE_INFINITY) - (b.currentPrice ?? Number.POSITIVE_INFINITY))
  if (sort === 'discount') {
    return copy.sort((a, b) => {
      const discountA = a.originalPrice !== null && a.currentPrice !== null && a.originalPrice > 0 ? 1 - a.currentPrice / a.originalPrice : 0
      const discountB = b.originalPrice !== null && b.currentPrice !== null && b.originalPrice > 0 ? 1 - b.currentPrice / b.originalPrice : 0
      return discountB - discountA
    })
  }
  return copy
}
