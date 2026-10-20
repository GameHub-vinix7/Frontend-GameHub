import { Navigate, useParams } from 'react-router'
import CatalogPage from './CatalogPage'
import type { GameCardData } from '../types/game'
import { isStoreCatalogId } from '../data/catalogOptions'

type StoreCatalogPageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
  favoriteIds: readonly string[]
  onToggleFavorite: (gameId: string) => void
}

function StoreCatalogPage({ games, priceStatus, favoriteIds, onToggleFavorite }: StoreCatalogPageProps) {
  const { storeId } = useParams<'storeId'>()

  if (!isStoreCatalogId(storeId)) {
    return <Navigate to="/catalog" replace />
  }

  return (
    <CatalogPage
      key={storeId}
      fixedStore={storeId}
      games={games}
      priceStatus={priceStatus}
      favoriteIds={favoriteIds}
      onToggleFavorite={onToggleFavorite}
    />
  )
}

export default StoreCatalogPage
