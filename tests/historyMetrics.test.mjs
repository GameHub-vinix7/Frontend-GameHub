import test from 'node:test'
import assert from 'node:assert/strict'
import { historyDiscount, sortHistoryNewest, summarizeHistory } from '../src/lib/historyMetrics.ts'

// Isolated calculation fixtures: NEVER used as UI or production history.
const older = { observedAt: 1, currentPrice: 799000, originalPrice: 799000 }
const newer = { observedAt: 2, currentPrice: 319600, originalPrice: 799000 }

test('an empty D1 history never invents pricing statistics', () => {
  assert.equal(summarizeHistory([]), null)
})

test('one observed Steam price is counted once, never as a month or day range', () => {
  const single = { observedAt: 1792312076, currentPrice: 219750, originalPrice: 879000 }
  const summary = summarizeHistory([single])
  assert.equal(summary.observations, 1)
  assert.equal(summary.latest.currentPrice, 219750)
  assert.equal(summary.lowest.currentPrice, 219750)
  assert.equal(summary.largestDiscount, 75)
  assert.equal(summary.discountedObservations, 1)
  assert.equal(summary.firstObservedAt, summary.lastObservedAt)
})

test('metrics use recorded timestamp order and exact observation counts', () => {
  const input = [newer, older]
  const before = structuredClone(input)
  const summary = summarizeHistory(input)
  assert.equal(summary.latest.currentPrice, 319600)
  assert.equal(summary.lowest.currentPrice, 319600)
  assert.equal(summary.largestDiscount, 60)
  assert.equal(summary.discountedObservations, 1)
  assert.equal(summary.observations, 2)
  assert.equal(summary.firstObservedAt, 1)
  assert.equal(summary.lastObservedAt, 2)
  assert.deepEqual(input, before, 'calculation must not mutate API history')
  assert.deepEqual(sortHistoryNewest([older, newer]).map((point) => point.observedAt), [2, 1])
})

test('equal regular price has zero discount', () => {
  assert.equal(historyDiscount(older), 0)
})
