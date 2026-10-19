import { useEffect, useState } from 'react'
import { apiRequest, clientHeaders, type BackendGame } from '../lib/backendApi'

type WishlistResponse = { data: BackendGame[] }

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void apiRequest<WishlistResponse>('/wishlist', {
      signal: controller.signal,
      headers: clientHeaders(),
    }).then(({ data }) => {
      if (!controller.signal.aborted) {
        setFavoriteIds(Array.isArray(data) ? data.map((game) => game.slug) : [])
        setLoaded(true)
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) {
        console.warn('GameHub wishlist:', error)
        setLoaded(true)
      }
    })
    return () => controller.abort()
  }, [])

  const toggleFavorite = async (gameId: string) => {
    const removing = favoriteIds.includes(gameId)
    try {
      if (removing) {
        await apiRequest(`/wishlist/${encodeURIComponent(gameId)}`, {
          method: 'DELETE', headers: clientHeaders(),
        })
        setFavoriteIds((current) => current.filter((id) => id !== gameId))
      } else {
        await apiRequest('/wishlist', {
          method: 'POST',
          headers: { ...clientHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: gameId }),
        })
        setFavoriteIds((current) => current.includes(gameId) ? current : [...current, gameId])
      }
    } catch (error) {
      console.warn('GameHub wishlist update:', error)
      throw error
    }
  }

  return { favoriteIds, toggleFavorite, favoritesLoaded: loaded }
}
