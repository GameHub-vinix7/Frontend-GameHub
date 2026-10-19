import { useEffect, useState } from 'react'
import { API_BASE, apiRequest, mapBackendGames, withEpicDemoFallback, type BackendGame } from '../lib/backendApi'
import { epicPreviewGames } from '../data/demoGames'
import type { GameCardData } from '../types/game'

type PriceStatus = 'loading' | 'live' | 'unavailable'
type LivePrices = { games: readonly GameCardData[]; status: PriceStatus; fetchedAt: string | null }
type GamesPage = { data: BackendGame[]; meta?: { last_page?: number } }

export function useLivePrices(): LivePrices {
  const [result, setResult] = useState<LivePrices>({ games: [], status: 'loading', fetchedAt: null })
  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const all: BackendGame[] = []
        let page = 1
        let lastPage = 1
        do {
          const response = await apiRequest<GamesPage>(`/games?per_page=50&page=${page}`, { signal: controller.signal })
          if (!Array.isArray(response.data)) throw new Error('Format daftar game backend tidak valid')
          all.push(...response.data)
          lastPage = Math.max(1, Number(response.meta?.last_page) || 1)
          page += 1
        } while (page <= lastPage)
        if (!controller.signal.aborted) {
          setResult({ games: withEpicDemoFallback(mapBackendGames(all), [...epicPreviewGames]), status: 'live', fetchedAt: new Date().toISOString() })
        }
      } catch (error) {
        if (controller.signal.aborted) return
        console.warn('GameHub backend:', error)
        setResult({ games: [], status: 'unavailable', fetchedAt: null })
      }
    }
    void load()
    return () => controller.abort()
  }, [])
  return result
}

export const LIVE_PRICE_API_BASE = API_BASE
