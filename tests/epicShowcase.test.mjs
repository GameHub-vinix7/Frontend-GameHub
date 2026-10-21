import test from 'node:test'
import assert from 'node:assert/strict'
import { isReferenceOnlyGame, withEpicShowcase } from '../src/lib/epicShowcase.ts'

const reference = (id) => ({
  id, title: id, coverSrc: `local/${id}.webp`, store: 'steam',
  originalPrice: null, currentPrice: null, rating: 7, genres: ['Action'],
})
const featured = ['battlefield-6', 'detroit-become-human', 'sekiro-shadows-die-twice', 'red-dead-redemption-2'].map(reference)

test('four Epic reference cards remain visible while the backend is unavailable', () => {
  const cards = withEpicShowcase([], [], featured)
  assert.equal(cards.length, 4)
  assert.deepEqual(cards.map((card) => card.id), featured.map((card) => card.id))
  for (const card of cards) {
    assert.equal(card.store, 'epic')
    assert.equal(card.currentPrice, null)
    assert.equal(card.originalPrice, null)
    assert.equal(card.currency, undefined)
    assert.equal(card.dealUrl, undefined)
    assert.equal(card.rating, null)
    assert.equal(card.previewOnly, true)
  }
})

test('only genuine API Epic offers can supply price and discount values', () => {
  const apiGame = { slug: 'battlefield-6', title: 'Battlefield 6', genre: 'Shooter' }
  const steam = { ...reference('battlefield-6'), store: 'steam', currentPrice: 200000, originalPrice: 300000 }
  const epic = { ...reference('battlefield-6'), store: 'epic', currentPrice: 75000, originalPrice: 100000, currency: 'IDR' }
  const cards = withEpicShowcase([apiGame], [steam, epic], featured)
  assert.equal(cards.filter((card) => card.store === 'steam').length, 1)
  assert.equal(cards.filter((card) => card.id === 'battlefield-6' && card.store === 'epic').length, 1)
  assert.equal(cards.find((card) => card.id === 'battlefield-6' && card.store === 'epic').currentPrice, 75000)
  assert.equal(cards.find((card) => card.id === 'battlefield-6' && card.store === 'epic').previewOnly, undefined)
  assert.equal(cards.find((card) => card.id === 'detroit-become-human' && card.store === 'epic').currentPrice, null)
})

test('existing backend game without Epic offer can open its detail but gets no invented price', () => {
  const backend = [{ slug: 'sekiro-shadows-die-twice', title: 'Sekiro', genre: 'Action' }]
  const cards = withEpicShowcase(backend, [reference('sekiro-shadows-die-twice')], featured)
  const epic = cards.find((card) => card.id === 'sekiro-shadows-die-twice' && card.store === 'epic')
  assert.equal(epic.previewOnly, false)
  assert.equal(epic.currentPrice, null)
  assert.equal(epic.originalPrice, null)
  assert.equal(epic.dealUrl, undefined)
})

test('other verified Epic and GOG offers are retained without duplicates', () => {
  const gog = { ...reference('witcher-3'), store: 'gog', currentPrice: 123000 }
  const otherEpic = { ...reference('hades'), store: 'epic', currentPrice: 99000 }
  const cards = withEpicShowcase([], [gog, otherEpic], featured)
  assert.equal(cards.length, 6)
  assert.deepEqual(cards.filter((card) => card.store === 'epic').map((card) => card.id), [
    'battlefield-6', 'detroit-become-human', 'sekiro-shadows-die-twice', 'red-dead-redemption-2', 'hades',
  ])
  assert.equal(cards.filter((card) => card.store === 'gog')[0].currentPrice, 123000)
})


test('reference-only Epic cards can use bundled detail media without a backend request', () => {
  const cards = withEpicShowcase([], [], featured)
  assert.ok(cards.every((card) => card.previewOnly))
  for (const card of cards) {
    assert.equal(isReferenceOnlyGame([card]), true)
    assert.equal(card.currentPrice, null)
  }
})

test('verified backend cards still require live API detail and history', () => {
  const real = { ...reference('control-ultimate-edition'), store: 'steam', previewOnly: undefined }
  assert.equal(isReferenceOnlyGame([]), false)
  assert.equal(isReferenceOnlyGame([real]), false)
  assert.equal(isReferenceOnlyGame([{ ...real, previewOnly: true }, real]), false)
})


test('a uniquely titled backend game with an alternate slug retains its verified Epic offer', () => {
  const game = { slug: 'battlefield_6', title: 'Battlefield 6', genre: 'FPS' }
  const realEpic = {
    ...reference('battlefield_6'), store: 'epic', title: 'Battlefield 6',
    originalPrice: 200000, currentPrice: 150000, currency: 'IDR',
  }
  const cards = withEpicShowcase([game], [realEpic], featured)
  const matching = cards.filter((card) => card.title === 'Battlefield 6')
  assert.equal(matching.length, 1)
  assert.equal(matching[0].id, 'battlefield_6')
  assert.equal(matching[0].currentPrice, 150000)
  assert.equal(matching[0].originalPrice, 200000)
  assert.equal(matching[0].previewOnly, undefined)
})

test('ambiguous backend titles do not borrow the wrong store offer', () => {
  const games = [
    { slug: 'battlefield_6', title: 'Battlefield 6' },
    { slug: 'battlefield-6-ultimate', title: 'Battlefield: 6' },
  ]
  const realEpic = {
    ...reference('battlefield_6'), store: 'epic', title: 'Battlefield 6',
    originalPrice: 200000, currentPrice: 150000, currency: 'IDR',
  }
  const cards = withEpicShowcase(games, [realEpic], featured)
  const referenceCard = cards.find((card) => card.id === 'battlefield-6')
  assert.ok(referenceCard)
  assert.equal(referenceCard.previewOnly, true)
  assert.equal(referenceCard.currentPrice, null)
  assert.equal(cards.filter((card) => card.id === 'battlefield_6').length, 1)
})
