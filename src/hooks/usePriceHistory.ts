import { useEffect, useState } from 'react'
import { API_BASE, apiRequest } from '../lib/backendApi'
import type { StoreId } from '../types/game'

export type PriceHistoryPoint = { observedAt: number; currentPrice: number; originalPrice: number }
type HistoryState = { key: string; source: string | null; status: 'loading' | 'empty' | 'available' | 'unavailable'; points: PriceHistoryPoint[] }
type BackendHistory = { series?: Array<{ platform: string; currency: string; points: Array<{ recorded_at: string; original_price: number; final_price: number }> }> }
const PLATFORM: Record<StoreId, string> = { steam: 'Steam', epic: 'Epic Games', gog: 'CheapShark' }

export function usePriceHistory(gameId: string | undefined, store: StoreId): HistoryState {
  const key = gameId ? `${gameId}:${store}` : ''
  const [state, setState] = useState<HistoryState>({ key: '', source: null, status: 'loading', points: [] })
  useEffect(() => {
    const controller = new AbortController()
    if (!gameId) return
    const requestKey = `${gameId}:${store}`
    const target = `/games/${encodeURIComponent(gameId)}/price-history?platform=${encodeURIComponent(PLATFORM[store])}`
    void apiRequest<BackendHistory>(target, { signal: controller.signal, cache: 'no-store' })
      .then((result) => {
        const series = result.series?.find((item) => item.platform.toLowerCase() === PLATFORM[store].toLowerCase())
        const points = (series?.points ?? []).flatMap((point) => {
          const observedAt = Date.parse(point.recorded_at)
          if (!Number.isFinite(observedAt) || !Number.isFinite(point.final_price) || !Number.isFinite(point.original_price)) return []
          return [{ observedAt, currentPrice: point.final_price, originalPrice: point.original_price }]
        })
        if (!controller.signal.aborted) setState({ key: requestKey, source: 'Laravel GameHub API', status: points.length ? 'available' : 'empty', points })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.warn('GameHub price history:', error)
          setState({ key: requestKey, source: null, status: 'unavailable', points: [] })
        }
      })
    return () => controller.abort()
  }, [gameId, store])
  if (!API_BASE || !gameId) return { key, source: null, status: 'unavailable', points: [] }
  return state.key === key ? state : { key, source: null, status: 'loading', points: [] }
}
