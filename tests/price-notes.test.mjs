import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({
  envFile: false, appType: 'custom', logLevel: 'error',
  cacheDir: 'node_modules/.vite-price-notes-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(() => server.close())
const { PriceTable } = await server.ssrLoadModule('/src/components/ui/PriceTable.tsx')
const { getPriceGroups } = await server.ssrLoadModule('/src/lib/priceCatalog.ts')
const { priceCatalogs, massagePrices, depilationPrices } = await server.ssrLoadModule('/src/data/prices.ts')
const render = group => renderToStaticMarkup(createElement(PriceTable, { group, categoryId: 'massage' }))
const group = { id: 'test', title: 'Test', rows: massagePrices.slice(0, 3) }

test('absent, null, empty and whitespace notes leave identical card markup', () => {
  const baseline = render(group)
  assert.ok(!baseline.includes('price-row-note'))
  for (const note of [undefined, null, '', ' \n\t ']) {
    assert.equal(render({ ...group, note, rows: group.rows.map(row => ({ ...row, note })) }), baseline)
  }
})

test('a variant note follows its own price and booking without changing other variants', () => {
  const text = '  Testovací poznámka pouze k této variantě.  '
  const html = render({ ...group, rows: group.rows.map((row, index) => ({ ...row, note: index === 1 ? text : undefined })) })
  assert.equal((html.match(/class="price-row-note"/g) ?? []).length, 1)
  assert.ok(html.includes('<p>Testovací poznámka pouze k této variantě.</p>'))
  assert.ok(html.indexOf('data-price-note-for="massage-price-whole-90"') > html.indexOf('data-price-id="massage-price-whole-90"'))
  const beforeNote = html.slice(0, html.indexOf('data-price-note-for='))
  assert.equal((beforeNote.match(/class="price-value"/g) ?? []).length, 2)
  assert.equal((beforeNote.match(/price-row-booking/g) ?? []).length, 2)
  assert.equal((html.match(/price-row-booking/g) ?? []).length, 3)
})

test('a shared group note appears once after all variants and survives catalog projection', () => {
  const catalog = { ...priceCatalogs.find(item => item.id === 'massage'), groups: [{ ...group, note: 'Společná testovací poznámka.' }] }
  const [display] = getPriceGroups(catalog, 'women')
  const html = render(display)
  assert.equal((html.match(/Společná testovací poznámka\./g) ?? []).length, 1)
  assert.ok(html.indexOf('Společná testovací poznámka.') > html.indexOf('</table>'))
  assert.deepEqual(display.rows.map(row => [row.id, row.label, row.price, row.detail]), group.rows.map(row => [row.id, row.label, row.price, row.detail]))
})

test('original depilation rows support common notes and audience overrides remain scoped', () => {
  const catalog = {
    ...priceCatalogs.find(item => item.id === 'depilation'),
    groups: [{ id: 'face', title: 'Test', rows: [{ ...depilationPrices[0], sourceIds: [], note: 'Společná', menNote: 'Pouze muži' }] }],
  }
  assert.equal(getPriceGroups(catalog, 'women')[0].rows[0].note, 'Společná')
  assert.equal(getPriceGroups(catalog, 'men')[0].rows[0].note, 'Pouze muži')
  catalog.groups[0].rows[0].menNote = '   '
  assert.ok(!render(getPriceGroups(catalog, 'men')[0]).includes('price-row-note'))
  catalog.groups[0].rows[0].men = null
  assert.deepEqual(getPriceGroups(catalog, 'men'), [])
})

test('notes render long multiline text safely without interpreting HTML', () => {
  const note = `První řádek.\n${'Dlouhý text '.repeat(40)}<script>alert("test")</script>`
  const html = render({ ...group, note })
  assert.ok(html.includes('První řádek.\nDlouhý text'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(!html.includes('<script>'))
})
