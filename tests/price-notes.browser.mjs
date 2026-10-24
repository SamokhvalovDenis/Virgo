import assert from 'node:assert/strict'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const output = new URL('../reports/qa/price-notes/', import.meta.url)
await mkdir(output, { recursive: true })
const preview = await startPreview()
const server = await createServer({
  envFile: false, appType: 'custom', logLevel: 'error',
  cacheDir: 'node_modules/.vite-price-notes-browser',
  server: { middlewareMode: true, hmr: false, watch: null },
})
let browser
try {
  const { PriceTable } = await server.ssrLoadModule('/src/components/ui/PriceTable.tsx')
  const { getPriceGroups } = await server.ssrLoadModule('/src/lib/priceCatalog.ts')
  const { priceCatalogs } = await server.ssrLoadModule('/src/data/prices.ts')
  // Test-only content: the production price data is never edited for screenshots.
  const sharedNote = 'Společná testovací poznámka pro všechny varianty v této kartě.'
  const longNote = `Testovací poznámka konkrétní varianty. ${'Delší text s diakritikou pro ověření zalamování. '.repeat(5)}\n${'Dlouhéslovo'.repeat(18)}`
  const catalog = structuredClone(priceCatalogs.find(item => item.id === 'massage'))
  catalog.groups = [{
    ...catalog.groups[0],
    rows: catalog.groups[0].rows.slice(0, 4).map(row => ({ ...row, note: undefined })),
    note: sharedNote,
  }]
  catalog.groups[0].rows.find(row => row.id === 'massage-price-whole-90').note = longNote
  const [group] = getPriceGroups(catalog, 'women')
  const cards = [
    group,
    { ...group, id: 'without-note', note: undefined, rows: group.rows.map(row => ({ ...row, note: undefined })) },
    { ...group, id: 'empty-note', note: ' \n ', rows: group.rows.map(row => ({ ...row, note: null })) },
  ]
  const markup = cards.map(card => renderToStaticMarkup(createElement(PriceTable, { group: card, categoryId: catalog.id }))).join('')
  const index = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  const styles = (index.match(/<link\b[^>]*rel="stylesheet"[^>]*>/g) ?? []).join('')
  assert.ok(styles, 'Use the production stylesheet for the fixture')
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  await context.route('https://www.termino.eu/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Booking test</title>' }))
  for (const width of [320, 390, 768, 1280, 1920]) {
    const page = await context.newPage()
    await page.setViewportSize({ width, height: 1000 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/__price-notes-test', route => route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body><main class="price-section section-space"><div class="price-container"><div class="price-groups">${markup}</div></div></main></body></html>`,
    }))
    await page.goto(`${preview.origin}/__price-notes-test`, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const first = page.locator('.price-group').first()
    assert.equal(await first.locator('.price-row-note').count(), 2)
    assert.equal(await first.locator('.price-note-row').count(), 1)
    assert.equal(await first.locator('.price-group-body > .price-row-note').innerText(), sharedNote)
    assert.equal(await first.locator('[data-price-note-for="massage-price-whole-90"] p').textContent(), longNote)
    const layout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('.price-group')]
      const issues = [...document.querySelectorAll('.price-row-note')].flatMap(note => {
        const bounds = note.getBoundingClientRect()
        const card = note.closest('.price-group').getBoundingClientRect()
        const text = note.querySelector('p')
        const row = note.closest('tr')?.previousElementSibling
        const preceding = row ? [...row.querySelectorAll('.price-value, .price-row-booking')] : [...note.previousElementSibling.querySelectorAll('.price-row-booking')]
        return bounds.left < card.left || bounds.right > card.right || text.scrollWidth > text.clientWidth + 1 || preceding.some(element => element.getBoundingClientRect().bottom > bounds.top + 1)
          ? ['Note clips or overlaps a price/booking button'] : []
      })
      return {
        issues, overflow: document.documentElement.scrollWidth > innerWidth,
        emptyHeight: cards[2].getBoundingClientRect().height,
        absentHeight: cards[1].getBoundingClientRect().height,
      }
    })
    assert.deepEqual(layout.issues, [], `Note layout at ${width}`)
    assert.equal(layout.overflow, false, `No overflow at ${width}`)
    assert.equal(layout.emptyHeight, layout.absentHeight, `Empty notes leave no space at ${width}`)
    assert.equal(await page.locator('.price-group').nth(1).locator('.price-row-note').count(), 0)
    const popupPromise = page.waitForEvent('popup')
    await first.locator('.price-row-booking').nth(1).click()
    const popup = await popupPromise
    await popup.waitForLoadState('domcontentloaded')
    assert.equal(popup.url(), 'https://www.termino.eu/r/beauty-studio-litomerice')
    await popup.close()
    await page.screenshot({ path: fileURLToPath(new URL(`notes-${width}.png`, output)), fullPage: true })
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('Passed note layout, wrapping, empty-state and booking checks at 320, 390, 768, 1280 and 1920px.')
} finally {
  if (browser) await browser.close()
  await server.close()
  await preview.close()
}
