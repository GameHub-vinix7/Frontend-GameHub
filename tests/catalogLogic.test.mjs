import test from 'node:test'
import assert from 'node:assert/strict'
import { filterCatalogGames, sortCatalogGames } from '../src/lib/catalogLogic.ts'

const offers = Object.freeze([
  { id: 'alpha', title: 'Alpha', store: 'steam', genres: ['Action'], originalPrice: 200, currentPrice: 100 },
  { id: 'alpha', title: 'Alpha', store: 'epic', genres: ['Action'], originalPrice: 200, currentPrice: 160 },
  { id: 'beta', title: 'Beta', store: 'steam', genres: ['Adventure'], originalPrice: 200, currentPrice: 190 },
  { id: 'gamma', title: 'Gamma', store: 'epic', genres: ['Action'], originalPrice: 0, currentPrice: 0 },
])
const criteria = { shops: [], genres: [], query: '' }

test('unfiltered catalog includes all offers without modifying the source', () => {
  assert.equal(filterCatalogGames(offers, criteria).length, 4)
  assert.equal(offers.length, 4)
})

test('search, shops and genres combine consistently', () => {
  const result = filterCatalogGames(offers, { shops: ['steam'], genres: ['Action'], query: 'aLpHa' })
  assert.deepEqual(result.map((game) => game.store), ['steam'])
})

test('genre selection works without initial hidden defaults', () => {
  const result = filterCatalogGames(offers, { shops: [], genres: ['Adventure'], query: '' })
  assert.deepEqual(result.map((game) => game.id), ['beta'])
})

test('GOG is a catalog filter, but no offer is invented when data is absent', () => {
  assert.deepEqual(filterCatalogGames(offers, { shops: ['gog'], genres: [], query: '' }), [])
})

test('a fixed Steam route never leaks Epic offers even with other selected shops', () => {
  const result = filterCatalogGames(offers, { shops: ['epic', 'gog'], genres: [], query: '', fixedStore: 'steam' })
  assert.ok(result.length > 0)
  assert.ok(result.every((game) => game.store === 'steam'))
})

test('lowest-price sort compares numerical values and keeps source intact', () => {
  const result = sortCatalogGames(offers, 'lowest')
  assert.deepEqual(result.map((game) => game.currentPrice), [0, 100, 160, 190])
  assert.deepEqual(offers.map((game) => game.currentPrice), [100, 160, 190, 0])
})

test('highest-discount sort excludes division by zero errors', () => {
  const result = sortCatalogGames(offers, 'discount')
  assert.deepEqual(result.map((game) => game.currentPrice), [100, 160, 190, 0])
})

test('source-order fallback is stable and does not claim date-based sorting', () => {
  assert.deepEqual(sortCatalogGames(offers, 'latest'), [...offers])
})
