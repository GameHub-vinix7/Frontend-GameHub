import { useCallback, useRef, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router'

import Navbar from './components/layout/Navbar'
import transitionStyles from './styles/RouteTransition.module.css'
import Footer from './components/layout/Footer'
import FavoriteToast, { type FavoriteNotice } from './components/feedback/FavoriteToast'
import { useFavorites } from './hooks/useFavorites'
import { useLivePrices } from './hooks/useLivePrices'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import FavoritesPage from './pages/FavoritesPage'
import StoreCatalogPage from './pages/StoreCatalogPage'
import GameDetailPage from './pages/GameDetailPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const { games, status } = useLivePrices()
  const [notices, setNotices] = useState<FavoriteNotice[]>([])
  const nextNoticeId = useRef(0)

  const handleFavoriteToggle = async (gameId: string) => {
    const action = favoriteIds.includes(gameId) ? 'removed' : 'added'
    try {
      await toggleFavorite(gameId)
      const id = ++nextNoticeId.current
      setNotices((current) => [...current, { id, action }])
    } catch {
      // Hook logs the server error; do not show a success toast on failure.
    }
  }

  const dismissNotice = useCallback((id: number) => {
    setNotices((current) => current.filter((item) => item.id !== id))
  }, [])

  const handleSearch = (query: string) => {
    const params = new URLSearchParams({ q: query.trim() })
    navigate(`/catalog?${params.toString()}`)
  }

  return (
    <>
      <Navbar
        onFavoriteClick={() => navigate('/favorites')}
        onSearch={handleSearch}
      />

      <div key={location.pathname} className={transitionStyles.routeEnter}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                games={games}
                priceStatus={status}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleFavoriteToggle}
              />
            }
          />
          <Route
            path="/catalog"
            element={
              <CatalogPage
                games={games}
                priceStatus={status}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleFavoriteToggle}
              />
            }
          />
          <Route
            path="/favorites"
            element={
              <FavoritesPage
                games={games}
                priceStatus={status}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleFavoriteToggle}
              />
            }
          />
          <Route
            path="/stores/:storeId"
            element={
              <StoreCatalogPage
                games={games}
                priceStatus={status}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleFavoriteToggle}
              />
            }
          />
          <Route path="/games/:gameId" element={<GameDetailPage games={games} priceStatus={status} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Footer />

      <FavoriteToast notices={notices} onDismiss={dismissNotice} />
    </>
  )
}

export default App