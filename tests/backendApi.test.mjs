import test from 'node:test'
import assert from 'node:assert/strict'
import { addEpicStorefrontCards, mapBackendGame, mapBackendGames, mapSystemRequirements } from '../src/lib/backendApi.ts'

const epicGames = [
  {
    id: 11,
    slug: 'hades',
    title: 'Hades',
    genre: 'Action Roguelike',
    cover_image: 'https://cdn.example.test/hades.jpg',
    description: 'Defy the god of the dead.',
    last_synced_at: '2026-10-19T09:03:44+00:00',
    offers: [
      { platform: 'Epic Games', original_price: 139000, final_price: 90350, currency: 'IDR', store_url: 'https://store.epicgames.com/p/hades' },
    ],
    system_requirements: [
      { type: 'minimum', operating_system: 'Windows 10', processor: 'Intel Core i5', memory: '8 GB RAM', graphics: 'GTX 770', network: null, storage: '15 GB', sound_card: null },
      { type: 'recommended', operating_system: 'Windows 11', processor: 'Intel Core i7', memory: '16 GB RAM', graphics: 'RTX 2060', network: null, storage: '15 GB', sound_card: null },
    ],
  },
  {
    id: 12,
    slug: 'celeste',
    title: 'Celeste',
    genre: 'Platformer',
    cover_image: 'https://cdn.example.test/celeste.jpg',
    description: null,
    last_synced_at: null,
    offers: [
      { platform: 'Epic Games', original_price: 99000, final_price: 49500, currency: 'IDR', store_url: 'https://store.epicgames.com/p/celeste' },
    ],
  },
  {
    id: 13,
    slug: 'sifu',
    title: 'Sifu',
    genre: 'Action',
    cover_image: 'https://cdn.example.test/sifu.jpg',
    offers: [
      { platform: 'Epic Games', original_price: null, final_price: null, currency: null, store_url: 'https://store.epicgames.com/p/sifu' },
    ],
  },
]

test('maps backend Epic offers using the game identity from the API', () => {
  const cards = mapBackendGame(epicGames[0])
  assert.equal(cards.length, 1)
  assert.deepEqual(
    { id: cards[0].id, store: cards[0].store, title: cards[0].title, coverSrc: cards[0].coverSrc },
    { id: 'hades', store: 'epic', title: 'Hades', coverSrc: 'https://cdn.example.test/hades.jpg' },
  )
  assert.equal(cards[0].originalPrice, 139000)
  assert.equal(cards[0].currentPrice, 90350)
  assert.equal(cards[0].currency, 'IDR')
  assert.equal(cards[0].dealUrl, 'https://store.epicgames.com/p/hades')
  assert.deepEqual(cards[0].genres, ['Action Roguelike'])
  assert.equal(cards[0].description, 'Defy the god of the dead.')
})

test('keeps several Epic games distinct and never mixes their offers', () => {
  const cards = mapBackendGames(epicGames)
  assert.deepEqual(cards.map(({ id, store, currentPrice }) => ({ id, store, currentPrice })), [
    { id: 'hades', store: 'epic', currentPrice: 90350 },
    { id: 'celeste', store: 'epic', currentPrice: 49500 },
    { id: 'sifu', store: 'epic', currentPrice: null },
  ])
})

test('an Epic offer without a valid IDR price is still shown as unavailable', () => {
  const [card] = mapBackendGame(epicGames[2])
  assert.equal(card.store, 'epic')
  assert.equal(card.currentPrice, null)
  assert.equal(card.originalPrice, null)
  assert.equal(card.currency, undefined)
  assert.equal(card.dealUrl, 'https://store.epicgames.com/p/sifu')
})

test('non-IDR offers are not presented as rupiah prices', () => {
  const [card] = mapBackendGame({
    slug: 'usd-game', title: 'USD Game', genre: null,
    offers: [{ platform: 'Epic Games', original_price: 20, final_price: 10, currency: 'USD', store_url: 'https://store.epicgames.com/p/usd-game' }],
  })
  assert.equal(card.currentPrice, null)
  assert.equal(card.originalPrice, null)
  assert.equal(card.currency, undefined)
})

test('discount is only expressed when the original price is valid and higher', () => {
  const [noDiscount] = mapBackendGame({
    slug: 'flat', title: 'Flat', genre: null,
    offers: [{ platform: 'Epic Games', original_price: null, final_price: 50000, currency: 'IDR' }],
  })
  assert.equal(noDiscount.originalPrice, 50000)
  const [inverted] = mapBackendGame({
    slug: 'inverted', title: 'Inverted', genre: null,
    offers: [{ platform: 'Epic Games', original_price: 10000, final_price: 50000, currency: 'IDR' }],
  })
  assert.equal(inverted.originalPrice, 50000)
})

test('unsupported storefronts, empty offers and unsafe URLs are not fabricated', () => {
  assert.deepEqual(mapBackendGame({ slug: 'empty', title: 'Empty', offers: [] }), [])
  assert.deepEqual(mapBackendGame({ slug: 'other', title: 'Other', offers: [{ platform: 'CheapShark', final_price: 4, currency: 'IDR' }] }), [])
  assert.deepEqual(mapBackendGames([{ slug: 'empty', title: 'Empty', offers: [] }]), [])
  const [unsafe] = mapBackendGame({
    slug: 'unsafe', title: 'Unsafe', genre: null,
    offers: [{ platform: 'Epic Games', final_price: 1, currency: 'IDR', store_url: 'javascript:alert(1)' }],
  })
  assert.equal(unsafe.dealUrl, undefined)
})

test('system requirements come from the API and skip missing fields', () => {
  assert.deepEqual(mapSystemRequirements(epicGames[0].system_requirements, 'minimum'), [
    { label: 'OS', value: 'Windows 10' },
    { label: 'Prosesor', value: 'Intel Core i5' },
    { label: 'Memori', value: '8 GB RAM' },
    { label: 'Grafis', value: 'GTX 770' },
    { label: 'Penyimpanan', value: '15 GB' },
  ])
  assert.deepEqual(mapSystemRequirements(epicGames[0].system_requirements, 'recommended').map((spec) => spec.label), [
    'OS', 'Prosesor', 'Memori', 'Grafis', 'Penyimpanan',
  ])
  assert.deepEqual(mapSystemRequirements(undefined, 'minimum'), [])
  assert.deepEqual(mapSystemRequirements([], 'recommended'), [])
})

test('Epic storefront view uses backend identity and never duplicates a real Epic offer', () => {
  const games = [
    {
      slug: 'hades', title: 'Hades', genre: 'Action Roguelike', cover_image: 'https://cdn.example.test/hades.jpg',
      description: 'Backend description',
      offers: [
        { platform: 'Steam', original_price: 139000, final_price: 90350, currency: 'IDR' },
        { platform: 'Epic Games', original_price: 139000, final_price: 95000, currency: 'IDR', store_url: 'https://store.epicgames.com/p/hades' },
      ],
    },
    {
      slug: 'celeste', title: 'Celeste', genre: 'Platformer', cover_image: 'https://cdn.example.test/celeste.jpg',
      description: null,
      offers: [{ platform: 'Steam', original_price: 99000, final_price: 49500, currency: 'IDR' }],
    },
    {
      slug: 'sifu', title: 'Sifu', genre: 'Action', cover_image: null,
      offers: [{ platform: 'Steam', original_price: 219000, final_price: 175200, currency: 'IDR' }],
    },
  ]

  const cards = addEpicStorefrontCards(games, mapBackendGames(games))
  const epicCards = cards.filter((card) => card.store === 'epic')

  assert.deepEqual(epicCards.map(({ id, title, currentPrice }) => ({ id, title, currentPrice })), [
    { id: 'hades', title: 'Hades', currentPrice: 95000 },
    { id: 'celeste', title: 'Celeste', currentPrice: null },
    { id: 'sifu', title: 'Sifu', currentPrice: null },
  ])
  assert.equal(cards.filter((card) => card.store === 'steam').length, 3)
  assert.equal(cards.filter((card) => card.id === 'hades' && card.store === 'epic').length, 1)
  assert.equal(epicCards.find((card) => card.id === 'celeste').coverSrc, 'https://cdn.example.test/celeste.jpg')
  assert.deepEqual(epicCards.find((card) => card.id === 'celeste').genres, ['Platformer'])
})
