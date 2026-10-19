import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchCatalog, parseSteamPrice } from '../backend/src/regionalPricing.mjs'

const asSteamPayload = (appid, currency = 'IDR', initial = 59990000, final = 14990000) => ({
  [appid]: { success: true, data: { price_overview: {
    currency, initial, final, discount_percent: 75,
  } } },
})

test('Steam regional IDR minor units are converted to rupiah, not FX-converted dollars', () => {
  const offer = parseSteamPrice('red-dead-redemption-2', '1174180',
    asSteamPayload('1174180'), '2026-10-18T08:00:00Z')
  assert.equal(offer.originalPrice, 599900)
  assert.equal(offer.currentPrice, 149900)
  assert.equal(offer.discountPercent, 75)
  assert.equal(offer.currency, 'IDR')
  assert.equal(offer.country, 'ID')
  assert.equal(offer.store, 'steam')
})

test('USD response must never masquerade as Indonesia price', () => {
  const offer = parseSteamPrice('red-dead-redemption-2', '1174180',
    asSteamPayload('1174180', 'USD'), '2026-10-18T08:00:00Z')
  assert.equal(offer, null)
})

test('unsupported, missing and inconsistent prices are not fabricated', () => {
  assert.equal(parseSteamPrice('x', '1', { 1: { success: false } }, 'now'), null)
  assert.equal(parseSteamPrice('x', '1', asSteamPayload('1','IDR',10000,20000), 'now'), null)
  assert.equal(parseSteamPrice('x', '1', { 1: { success: true, data: {} } }, 'now'), null)
})

test('regional catalog requests cc=id for each app and never emits Epic/GOG guesses', async () => {
  const urls = []
  const fetcher = async (url) => {
    urls.push(url)
    const id = new URL(url).searchParams.get('appids')
    return { ok: true, json: async () => asSteamPayload(id) }
  }
  const data = await fetchCatalog(fetcher, new Date('2026-10-18T08:00:00Z'))
  assert.equal(data.offers.length, 4)
  assert.equal(data.currency, 'IDR')
  assert.equal(data.country, 'ID')
  assert.ok(data.offers.every((offer) => offer.store === 'steam' && offer.currency === 'IDR'))
  assert.ok(urls.every((url) => new URL(url).searchParams.get('cc') === 'id'))
  assert.equal(urls.length, 4)
})

test('partial Steam outage preserves verified prices from other games', async () => {
  const fetcher = async (url) => {
    const id = new URL(url).searchParams.get('appids')
    if (id === '2807960') return { ok: false, status: 429 }
    return { ok: true, json: async () => asSteamPayload(id) }
  }
  const data = await fetchCatalog(fetcher)
  assert.equal(data.offers.length, 3)
  assert.equal(data.partial, true)
})

test('complete lack of verified IDR prices becomes explicit error', async () => {
  const fetcher = async (url) => {
    const id = new URL(url).searchParams.get('appids')
    return { ok: true, json: async () => asSteamPayload(id, 'USD') }
  }
  await assert.rejects(fetchCatalog(fetcher), /No verified IDR prices/)
})
