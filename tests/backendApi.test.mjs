import test from 'node:test'
import assert from 'node:assert/strict'
import { mapBackendGame, mapBackendGames, withEpicDemoFallback } from '../src/lib/backendApi.ts'
import { epicDemoPrices } from '../src/data/epicDemoPrices.ts'

test('Epic demo prices are explicit IDR examples and never live prices', () => {
  assert.deepEqual(Object.keys(epicDemoPrices).sort(), [
    'battlefield-6', 'detroit-become-human', 'red-dead-redemption-2', 'sekiro-shadows-die-twice',
  ])
  for (const price of Object.values(epicDemoPrices)) {
    assert.equal(price.currency, 'IDR')
    assert.ok(Number.isFinite(price.originalPrice) && price.originalPrice > 0)
    assert.ok(Number.isFinite(price.currentPrice) && price.currentPrice > 0)
    assert.ok(price.currentPrice <= price.originalPrice)
  }
})
test('maps Laravel game resources and offer platform labels to frontend cards', () => {
  const cards = mapBackendGame({
    id: 4, slug: 'control-ultimate-edition', title: 'CONTROL Ultimate Edition',
    genre: 'Action', cover_image: 'https://example.test/cover.jpg',
    description: 'Backend description', last_synced_at: '2026-10-19T09:03:44+00:00',
    offers: [
      { platform: 'Steam', original_price: 299999, final_price: 44999, currency: 'IDR', store_url: 'https://store.steampowered.com/app/870780/' },
      { platform: 'Epic Games', original_price: 299999, final_price: 49999, currency: 'IDR', store_url: 'https://store.epicgames.com/' },
    ],
  })
  assert.deepEqual(cards.map(({ id, store, originalPrice, currentPrice, dealUrl }) => ({ id, store, originalPrice, currentPrice, dealUrl })), [
    { id: 'control-ultimate-edition', store: 'steam', originalPrice: 299999, currentPrice: 44999, dealUrl: 'https://store.steampowered.com/app/870780/' },
    { id: 'control-ultimate-edition', store: 'epic', originalPrice: 299999, currentPrice: 49999, dealUrl: 'https://store.epicgames.com/' },
  ])
  assert.deepEqual(cards[0].genres, ['Action'])
  assert.equal(cards[0].description, 'Backend description')
  assert.equal(cards[0].priceUpdatedAt, '2026-10-19T09:03:44+00:00')
})

test('adds demo Epic cards only when the backend has no Epic offers', () => {
  const steam = { id: 'live-one', store: 'steam' }
  const epicDemo = { id: 'demo-epic-one', store: 'epic' }
  const result = withEpicDemoFallback([steam], [epicDemo])
  assert.equal(result.length, 2)
  assert.equal(result[0], steam)
  assert.deepEqual(result[1], { ...epicDemo, isDemo: true })
  assert.deepEqual(withEpicDemoFallback([steam, { id: 'live-epic', store: 'epic' }], [epicDemo]), [steam, { id: 'live-epic', store: 'epic' }])
})
test('does not fabricate cards for unsupported storefronts or empty offers', () => {
  assert.deepEqual(mapBackendGame({ slug: 'empty-game', title: 'Empty', genre: null, offers: [] }), [])
  assert.deepEqual(mapBackendGame({ slug: 'other-game', title: 'Other', offers: [{ platform: 'CheapShark', final_price: 4 }] }), [])
  assert.deepEqual(mapBackendGames([{ slug: 'empty-game', title: 'Empty', offers: [] }]), [])
})
