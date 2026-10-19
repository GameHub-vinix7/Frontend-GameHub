import { GENRES, SHOPS, type GenreFilter, type ShopFilter } from '../data/catalogOptions.ts'
import type { CatalogSort } from './catalogLogic.ts'

export type CatalogUrlState = {
  shops: ShopFilter[]
  genres: GenreFilter[]
  sort: CatalogSort
  page: number
}

export type CatalogUrlPatch = Partial<CatalogUrlState>

const AVAILABLE_SORTS: readonly CatalogSort[] = ['latest', 'discount', 'lowest']

/** Read only known filter values so manually edited URLs cannot create invalid UI state. */
export function readCatalogUrlState(params: URLSearchParams): CatalogUrlState {
  const requestedSort = params.get('sort') as CatalogSort | null
  const requestedPage = params.get('page')
  const numericPage = requestedPage && /^\d+$/.test(requestedPage) ? Number(requestedPage) : 1

  return {
    shops: SHOPS.filter((shop) => params.getAll('shops').includes(shop)),
    genres: GENRES.filter((genre) => params.getAll('genres').includes(genre)),
    sort: requestedSort && AVAILABLE_SORTS.includes(requestedSort) ? requestedSort : 'latest',
    page: Number.isSafeInteger(numericPage) && numericPage >= 1 ? numericPage : 1,
  }
}

/** Patch filters without removing the existing search query or unrelated parameters. */
export function updateCatalogUrlState(
  current: URLSearchParams,
  patch: CatalogUrlPatch,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (patch.shops !== undefined) {
    next.delete('shops')
    SHOPS.filter((shop) => patch.shops?.includes(shop)).forEach((shop) => next.append('shops', shop))
  }
  if (patch.genres !== undefined) {
    next.delete('genres')
    GENRES.filter((genre) => patch.genres?.includes(genre)).forEach((genre) => next.append('genres', genre))
  }
  if (patch.sort !== undefined) {
    if (patch.sort === 'latest') next.delete('sort')
    else next.set('sort', patch.sort)
  }
  if (patch.page !== undefined) {
    if (patch.page <= 1) next.delete('page')
    else next.set('page', String(patch.page))
  }

  return next
}
