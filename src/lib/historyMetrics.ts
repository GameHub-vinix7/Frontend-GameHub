import type { PriceHistoryPoint } from '../hooks/usePriceHistory'

export type HistorySummary = {
  observations: number
  latest: PriceHistoryPoint
  lowest: PriceHistoryPoint
  largestDiscount: number
  discountedObservations: number
  firstObservedAt: number
  lastObservedAt: number
}

export function historyDiscount(point: PriceHistoryPoint): number {
  if (point.originalPrice <= 0 || point.currentPrice >= point.originalPrice) return 0
  return Math.round((1 - point.currentPrice / point.originalPrice) * 100)
}

/** Statistics describe only the recorded observations, never unobserved days. */
export function summarizeHistory(points: readonly PriceHistoryPoint[]): HistorySummary | null {
  if (!points.length) return null
  const ordered = [...points].sort((a, b) => a.observedAt - b.observedAt)
  let lowest = ordered[0]
  let largestDiscount = 0
  let discountedObservations = 0
  for (const point of ordered) {
    if (point.currentPrice < lowest.currentPrice) lowest = point
    const discount = historyDiscount(point)
    if (discount > 0) discountedObservations += 1
    if (discount > largestDiscount) largestDiscount = discount
  }
  return {
    observations: ordered.length,
    latest: ordered[ordered.length - 1],
    lowest,
    largestDiscount,
    discountedObservations,
    firstObservedAt: ordered[0].observedAt,
    lastObservedAt: ordered[ordered.length - 1].observedAt,
  }
}

export function sortHistoryNewest(points: readonly PriceHistoryPoint[]): PriceHistoryPoint[] {
  return [...points].sort((a, b) => b.observedAt - a.observedAt)
}
