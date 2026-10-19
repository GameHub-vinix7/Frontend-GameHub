import test from 'node:test'
import assert from 'node:assert/strict'
import worker from '../backend/src/index.mjs'

const url = 'http://localhost:8787/api/history?gameId=red-dead-redemption-2&store=steam'
const request = new Request(url, { headers: { Origin: 'http://localhost:5173' } })
function envWithPoints(points) {
  return {
    ALLOWED_ORIGINS: 'http://localhost:5173',
    DB: {
      prepare() {
        return {
          bind() {
            return { all: async () => ({ results: points }) }
          },
        }
      },
    },
  }
}

test('history endpoint never caches a previously empty database response', async () => {
  const response = await worker.fetch(request, envWithPoints([]), {})
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5173')
  const result = await response.json()
  assert.deepEqual(result.points, [])
  assert.equal(result.currency, 'IDR')
  assert.equal(result.country, 'ID')
})

test('history endpoint immediately exposes newly recorded IDR observations', async () => {
  const snapshot = { observedAt: 1792312076, currentPrice: 219750, originalPrice: 879000 }
  const response = await worker.fetch(request, envWithPoints([snapshot]), {})
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  const result = await response.json()
  assert.deepEqual(result.points, [snapshot])
  assert.equal(result.store, 'steam')
})
