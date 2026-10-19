import { useNavigate } from 'react-router'

import Hero from '../components/home/Hero'
import SaleEvents from '../components/home/SaleEvents'
import StoreSection from '../components/store/StoreSection'
import type { GameCardData } from '../types/game'
import type { StoreId } from '../types/game'

type HomePageProps = {
  games: readonly GameCardData[]
  priceStatus: 'loading' | 'live' | 'unavailable'
  favoriteIds: readonly string[]
  onToggleFavorite: (gameId: string) => void
}

function HomePage({ games, onToggleFavorite, favoriteIds }: HomePageProps) {
  const navigate = useNavigate()
  const openStore = (store: StoreId) => navigate(`/stores/${store}`)

  return (
    <main>
      <Hero />
      <SaleEvents />

      <div id="steam">
        <StoreSection
          store="steam"
          games={games.filter((game) => game.store === 'steam')}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onMoreClick={openStore}
        />
      </div>

      <div id="epic">
        <StoreSection
          store="epic"
          games={games.filter((game) => game.store === 'epic')}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onMoreClick={openStore}
        />
      </div>
    </main>
  )
}

export default HomePage