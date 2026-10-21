import test from 'node:test'
import assert from 'node:assert/strict'
import { verifiedStoreUrl } from '../src/data/verifiedStoreLinks.ts'

test('official store links reference a specific game product', () => {
  assert.equal(verifiedStoreUrl('battlefield-6', 'steam'), 'https://store.steampowered.com/app/2807960/?cc=id')
  assert.equal(verifiedStoreUrl('red-dead-redemption-2', 'epic'),
    'https://store.epicgames.com/p/red-dead-redemption-2')
  assert.equal(verifiedStoreUrl('detroit-become-human', 'epic'),
    'https://store.epicgames.com/p/detroit-become-human')
})

test('a store without a verified product page is never given a fabricated link', () => {
  assert.equal(verifiedStoreUrl('red-dead-redemption-2', 'gog'), null)
  assert.equal(verifiedStoreUrl('sekiro-shadows-die-twice', 'epic'), null)
  assert.equal(verifiedStoreUrl('unknown-game', 'steam'), null)
})


test('backend underscores reuse only already-verified official game URLs', () => {
  assert.equal(verifiedStoreUrl('battlefield_6', 'epic'), 'https://store.epicgames.com/p/battlefield-6')
  assert.equal(verifiedStoreUrl('unknown_backend_game', 'epic'), null)
})
