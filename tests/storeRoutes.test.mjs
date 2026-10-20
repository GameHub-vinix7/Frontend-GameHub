import test from 'node:test'
import assert from 'node:assert/strict'
import { isStoreCatalogId } from '../src/data/catalogOptions.ts'

test('store catalog routes accept Steam, Epic, and GOG', () => {
  assert.equal(isStoreCatalogId('steam'), true)
  assert.equal(isStoreCatalogId('epic'), true)
  assert.equal(isStoreCatalogId('gog'), true)
})

test('store catalog routes reject unknown stores', () => {
  assert.equal(isStoreCatalogId('unknown'), false)
  assert.equal(isStoreCatalogId(undefined), false)
})
