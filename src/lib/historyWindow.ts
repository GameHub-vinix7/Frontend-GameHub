import type { PriceHistoryPoint } from '../hooks/usePriceHistory'

export type FiveDayWindow = {
  startAt: number
  endAt: number
  ticks: number[]
}

const SECONDS_PER_DAY = 86400
const WIB_SECONDS = 7 * 3600

/**
 * Five calendar days, including today, in Asia/Jakarta (UTC+7, no DST).
 * These dates are display boundaries only; they never generate price points.
 */
export function fiveDayWindow(nowSeconds: number): FiveDayWindow {
  const wibDay = new Date((nowSeconds + WIB_SECONDS) * 1000)
  const startAt = Date.UTC(
    wibDay.getUTCFullYear(), wibDay.getUTCMonth(), wibDay.getUTCDate() - 4,
  ) / 1000 - WIB_SECONDS
  const ticks = Array.from({ length: 5 }, (_, index) =>
    Math.min(startAt + index * SECONDS_PER_DAY + SECONDS_PER_DAY / 2, nowSeconds),
  )
  return { startAt, endAt: nowSeconds, ticks }
}

export function observedWithin(
  points: readonly PriceHistoryPoint[],
  window: FiveDayWindow,
): PriceHistoryPoint[] {
  return points.filter((point) => point.observedAt >= window.startAt && point.observedAt <= window.endAt)
}

export function observedDayCount(points: readonly PriceHistoryPoint[]): number {
  return new Set(points.map((point) => {
    const date = new Date((point.observedAt + WIB_SECONDS) * 1000)
    return date.toISOString().slice(0, 10)
  })).size
}
