/**
 * Regional Indonesia pricing adapter.
 *
 * Steam Store appdetails is a public but undocumented storefront endpoint.
 * We request cc=id and ONLY accept explicit IDR responses. Epic/GOG remain
 * unpriced until a validated, permitted IDR source is integrated.
 */
export const GAME_REFERENCES = [
  { id: 'battlefield-6', steamAppId: '2807960' },
  { id: 'detroit-become-human', steamAppId: '1222140' },
  { id: 'sekiro-shadows-die-twice', steamAppId: '814380' },
  { id: 'red-dead-redemption-2', steamAppId: '1174180' },
]

export const STORE_IDS = ['steam', 'epic', 'gog']
export const COUNTRY = 'ID'
export const CURRENCY = 'IDR'
export const SOURCE = 'Steam Store'

function validMinorUnits(amount) {
  return Number.isSafeInteger(amount) && amount >= 0
}

export function parseSteamPrice(gameId, steamAppId, payload, fetchedAt) {
  const entry = payload?.[steamAppId]
  if (!entry || entry.success !== true) return null
  const overview = entry.data?.price_overview
  if (!overview || overview.currency !== CURRENCY) return null

  // Steam price_overview amounts are expressed in minor currency units (sen).
  const original = overview.initial
  const current = overview.final
  if (!validMinorUnits(original) || !validMinorUnits(current) || current > original) return null

  return {
    gameId,
    store: 'steam',
    originalPrice: original / 100,
    currentPrice: current / 100,
    currency: CURRENCY,
    country: COUNTRY,
    source: SOURCE,
    discountPercent: original > 0 ? Math.round((1 - current / original) * 100) : 0,
    fetchedAt,
    dealUrl: 'https://store.steampowered.com/app/' + steamAppId + '/?cc=id',
  }
}

export async function fetchCatalog(fetcher = fetch, now = new Date()) {
  const fetchedAt = now.toISOString()
  const responses = await Promise.allSettled(GAME_REFERENCES.map(async ({ id, steamAppId }) => {
    const url = 'https://store.steampowered.com/api/appdetails?appids='
      + encodeURIComponent(steamAppId) + '&cc=id&filters=price_overview'
    const response = await fetcher(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'GameHub-Academic/0.2 (+https://gamehub-eight-weld.vercel.app/)',
      },
    })
    if (!response.ok) throw new Error('Steam Store HTTP ' + response.status + ' for ' + steamAppId)
    let payload
    try {
      payload = await response.json()
    } catch {
      throw new Error('Steam Store response is not valid JSON for ' + steamAppId)
    }
    const offer = parseSteamPrice(id, steamAppId, payload, fetchedAt)
    if (!offer) {
      console.warn('[Steam] No confirmed Indonesia IDR price for ' + id)
    }
    return offer
  }))

  const offers = []
  let errors = 0
  responses.forEach((item, index) => {
    if (item.status === 'rejected') {
      errors++
      console.warn('[Steam] ' + GAME_REFERENCES[index].id + ': ' + String(item.reason))
    } else if (item.value) {
      offers.push(item.value)
    }
  })
  if (offers.length === 0) {
    throw new Error('No verified IDR prices were available from Steam (errors: ' + errors + ')')
  }
  return {
    source: SOURCE, currency: CURRENCY, country: COUNTRY,
    fetchedAt, partial: offers.length !== GAME_REFERENCES.length,
    offers,
  }
}
