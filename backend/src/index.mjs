import { fetchCatalog, GAME_REFERENCES, STORE_IDS } from './regionalPricing.mjs'

const validGames = new Set(GAME_REFERENCES.map((game) => game.id))
const validStores = new Set(STORE_IDS)

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin')
  const list = (env.ALLOWED_ORIGINS ?? '').split(',').map((value) => value.trim())
  return origin && list.includes(origin) ? origin : null
}

function json(request, env, payload, status = 200, seconds = 0) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': seconds ? 'public, max-age=' + seconds : 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
  })
  const origin = allowedOrigin(request, env)
  if (origin) headers.set('Access-Control-Allow-Origin', origin)
  return new Response(JSON.stringify(payload), { status, headers })
}

export async function saveSnapshots(database, offers, timeSeconds) {
  if (!database) throw new Error('D1 database binding is not configured')
  const writes = offers.map((offer) => database.prepare(
    'INSERT OR REPLACE INTO regional_price_history (game_id, store_id, observed_at, current_price, original_price, currency, country, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).bind(offer.gameId, offer.store, timeSeconds, offer.currentPrice, offer.originalPrice, 'IDR', 'ID', offer.source))
  if (writes.length) await database.batch(writes)
  return writes.length
}

async function respondToGet(request, env, ctx) {
  const url = new URL(request.url)
  if (url.pathname === '/api/health')
    return json(request, env, { ok: true, source: 'Steam Store', currency: 'IDR', country: 'ID' })

  if (url.pathname === '/api/catalog') {
    // Shared edge cache: no new upstream requests for every visitor/page transition.
    const key = new Request(url.origin + '/api/catalog?country=ID&currency=IDR&version=2')
    const cached = await caches.default.match(key)
    if (cached) return json(request, env, await cached.json(), 200, 300)
    try {
      const fresh = await fetchCatalog(fetch)
      const cachedResponse = new Response(JSON.stringify(fresh), {
        headers: { 'Cache-Control': 'public, max-age=1800' },
      })
      ctx.waitUntil(caches.default.put(key, cachedResponse))
      return json(request, env, fresh, 200, 300)
    } catch (error) {
      console.error('Catalog fetch error:', error)
      return json(request, env, { error: 'Data harga belum bisa diperbarui' }, 502)
    }
  }

  if (url.pathname === '/api/history') {
    const gameId = url.searchParams.get('gameId')
    const store = url.searchParams.get('store')
    if (!validGames.has(gameId) || !validStores.has(store))
      return json(request, env, { error: 'Invalid game or store' }, 400)
    if (!env.DB) return json(request, env, { error: 'History storage has not been configured' }, 503)
    try {
      const rows = await env.DB.prepare(
        'SELECT observed_at AS observedAt, current_price AS currentPrice, original_price AS originalPrice FROM regional_price_history WHERE game_id = ? AND store_id = ? ORDER BY observed_at DESC LIMIT 90',
      ).bind(gameId, store).all()
      return json(request, env, {
        gameId, store, source: store === 'steam' ? 'Steam Store' : null, currency: 'IDR', country: 'ID',
        points: [...(rows.results ?? [])].reverse(),
      }, 200, 0) // Do not cache an empty history response before the first D1 snapshot.
    } catch (error) {
      console.error('History query error:', error)
      return json(request, env, { error: 'Riwayat harga belum dapat dimuat' }, 503)
    }
  }
  return json(request, env, { error: 'Not found' }, 404)
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      const origin = allowedOrigin(request, env)
      return new Response(null, {
        status: origin ? 204 : 403,
        headers: origin ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Max-Age': '86400',
          Vary: 'Origin',
        } : { Vary: 'Origin' },
      })
    }
    if (request.method !== 'GET') return json(request, env, { error: 'Method not allowed' }, 405)
    return respondToGet(request, env, ctx)
  },
  async scheduled(event, env) {
    const snapshot = await fetchCatalog(fetch)
    await saveSnapshots(env.DB, snapshot.offers, Math.floor(event.scheduledTime / 1000))
  },
}
