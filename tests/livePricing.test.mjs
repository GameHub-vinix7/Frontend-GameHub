import test from 'node:test'
import assert from 'node:assert/strict'
import { discountPercent, formatPrice } from '../src/lib/prices.ts'
import { sortCatalogGames, filterCatalogGames } from '../src/lib/catalogLogic.ts'

const games = [
  { id: 'a', store: 'steam', title: 'A', genres: ['Action'], originalPrice: null, currentPrice: null },
  { id: 'b', store: 'epic', title: 'B', genres: ['Action'], originalPrice: 20, currentPrice: 5 },
  { id: 'c', store: 'gog', title: 'C', genres: ['Strategy'], originalPrice: 10, currentPrice: 10 },
]

test('missing price has no fabricated discount', () => {
  assert.equal(discountPercent(null, null), 0)
  assert.equal(formatPrice(null), 'Harga belum tersedia')
  assert.equal(discountPercent(20, 5), 75)
})

test('price formatting explicitly indicates Indonesian rupiah', () => {
  assert.match(formatPrice(12500), /Rp\s*12\.500/)
})

test('null prices never appear ahead of valid cheapest offers', () => {
  assert.deepEqual(sortCatalogGames(games, 'lowest').map((game) => game.id), ['b','c','a'])
})

test('catalog filters keep real GOG offers without introducing a GOG route', () => {
  const result = filterCatalogGames(games, { shops: ['gog'], genres: [], query: '' })
  assert.deepEqual(result.map((game) => game.store), ['gog'])
})

test('highest-discount sort correctly handles unavailable price', () => {
  assert.equal(sortCatalogGames(games, 'discount')[0].id, 'b')
})
