import test from 'node:test'
import assert from 'node:assert/strict'
import { readCatalogUrlState, updateCatalogUrlState } from '../src/lib/catalogUrlState.ts'

test('unfiltered catalog starts with neutral defaults', () => {
  assert.deepEqual(readCatalogUrlState(new URLSearchParams()), {
    shops: [], genres: [], sort: 'latest', page: 1,
  })
})

test('URL restores multiple shops, genres, sorting and page', () => {
  const params = new URLSearchParams('shops=steam&shops=epic&genres=Action&sort=lowest&page=2')
  assert.deepEqual(readCatalogUrlState(params), {
    shops: ['steam', 'epic'], genres: ['Action'], sort: 'lowest', page: 2,
  })
})

test('filter change resets pagination but preserves search query and sort', () => {
  const current = new URLSearchParams('q=Red+Dead&sort=lowest&page=2')
  const updated = updateCatalogUrlState(current, { shops: ['steam'], page: 1 })
  assert.equal(updated.get('q'), 'Red Dead')
  assert.equal(updated.get('sort'), 'lowest')
  assert.equal(updated.get('page'), null)
  assert.deepEqual(readCatalogUrlState(updated).shops, ['steam'])
  assert.equal(current.get('shops'), null)
})

test('reset filters preserves the search term and sorting selection', () => {
  const current = new URLSearchParams('q=dead&shops=gog&genres=Action&sort=discount&page=2')
  const updated = updateCatalogUrlState(current, { shops: [], genres: [], page: 1 })
  assert.equal(updated.get('q'), 'dead')
  assert.equal(updated.get('sort'), 'discount')
  assert.equal(updated.has('shops'), false)
  assert.equal(updated.has('genres'), false)
  assert.equal(updated.has('page'), false)
})

test('invalid or unsupported query parameters safely fall back to defaults', () => {
  const result = readCatalogUrlState(new URLSearchParams('shops=unknown&genres=Unknown&sort=bestseller&page=-3'))
  assert.deepEqual(result, { shops: [], genres: [], sort: 'latest', page: 1 })
  assert.equal(readCatalogUrlState(new URLSearchParams('page=999999999999999999999')).page, 1)
})

test('supported GOG filter is preserved without introducing fictitious store offers', () => {
  const updated = updateCatalogUrlState(new URLSearchParams(), { shops: ['gog'] })
  assert.deepEqual(readCatalogUrlState(updated).shops, ['gog'])
})

test('changing sort back to source order removes redundant sort param', () => {
  const updated = updateCatalogUrlState(new URLSearchParams('sort=lowest&page=2'), {
    sort: 'latest', page: 1,
  })
  assert.equal(updated.toString(), '')
})
