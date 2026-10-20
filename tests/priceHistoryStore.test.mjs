import assert from 'node:assert/strict'
import test from 'node:test'

import { platformNameForHistory, priceHistoryPath, preferredHistoryStore } from '../src/lib/priceHistoryPath.ts'

test('selects GOG history by default when a game has a GOG offer', () => {
  assert.equal(preferredHistoryStore(['gog', 'steam']), 'gog')
  assert.equal(preferredHistoryStore(['epic']), 'epic')
  assert.equal(preferredHistoryStore(['steam']), 'steam')
})

test('GOG series matching uses the GOG platform label and endpoint', () => {
  assert.equal(platformNameForHistory('gog'), 'GOG')
  assert.equal(priceHistoryPath('the-witcher-2', 'gog'), '/games/the-witcher-2/price-history?platform=GOG')
})
