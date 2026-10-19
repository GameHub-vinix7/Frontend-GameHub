import test from 'node:test'
import assert from 'node:assert/strict'
import { fiveDayWindow, observedWithin, observedDayCount } from '../src/lib/historyWindow.ts'

test('five-day range means 5 Jakarta calendar dates including today, not invented records', () => {
  // 18 Oct 2026, 21:00 WIB = 14:00 UTC
  const now = Date.UTC(2026, 9, 18, 14, 0, 0) / 1000
  const view = fiveDayWindow(now)
  assert.equal(view.startAt, Date.UTC(2026, 9, 13, 17, 0, 0) / 1000)
  assert.equal(view.endAt, now)
  assert.equal(view.ticks.length, 5)

  const earlier = { observedAt: view.startAt - 1, currentPrice: 100, originalPrice: 200 }
  const firstDay = { observedAt: view.startAt, currentPrice: 90, originalPrice: 200 }
  const today = { observedAt: now - 200, currentPrice: 80, originalPrice: 200 }
  const future = { observedAt: now + 200, currentPrice: 70, originalPrice: 200 }
  const raw = [earlier, firstDay, today, future]
  assert.deepEqual(observedWithin(raw, view), [firstDay, today])
  assert.equal(raw.length, 4, 'historical API points must not be mutated')
  assert.equal(observedDayCount(observedWithin(raw, view)), 2)
})

test('two observations on the same Jakarta date count as one covered day', () => {
  const now = Date.UTC(2026, 9, 18, 14, 0, 0) / 1000
  const view = fiveDayWindow(now)
  const points = [
    { observedAt: now - 3600, currentPrice: 219750, originalPrice: 879000 },
    { observedAt: now - 7200, currentPrice: 219750, originalPrice: 879000 },
  ]
  assert.equal(observedDayCount(observedWithin(points, view)), 1)
})
