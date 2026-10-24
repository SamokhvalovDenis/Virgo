import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const output = new URL('../reports/qa/prices/', import.meta.url)
await mkdir(output, { recursive: true })
const preview = await startPreview()
const { origin } = preview
let browser
const results = []
async function assertPriceLayout(prices, context) {
  const problems = await prices.locator('tbody .price-procedure').evaluateAll(rows => rows.flatMap(row => {
    const value = row.querySelector('.price-value')
    const booking = row.querySelector('.price-row-booking')
    const priceBounds = value.getBoundingClientRect()
    const bookingBounds = booking.getBoundingClientRect()
    const overlapX = Math.min(priceBounds.right, bookingBounds.right) - Math.max(priceBounds.left, bookingBounds.left)
    const overlapY = Math.min(priceBounds.bottom, bookingBounds.bottom) - Math.max(priceBounds.top, bookingBounds.top)
    return value.scrollWidth > value.clientWidth + 1 || (overlapX > 1 && overlapY > 1)
      ? [{ id: row.dataset.priceId, price: value.textContent, clipped: value.scrollWidth > value.clientWidth + 1, overlapX, overlapY }]
      : []
  }))
  assert.deepEqual(problems, [], `Prices fit without clipping or overlapping booking at ${context}`)
}
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const response = await page.goto(origin, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    const prices = page.locator('#prices')
    await prices.scrollIntoViewIfNeeded()
    const categories = prices.getByRole('group', { name: 'Kategorie služeb', exact: true })
    const cases = [
      { name: 'Depilace', women: 39, men: 41, key: 'depilation' },
      { name: 'Masáže', rows: 37, key: 'massage' },
      { name: 'Trvalé odstranění chloupků', women: 35, men: 34, key: 'hair-removal' },
      { name: 'Péče o obočí a řasy', rows: 12, key: 'brows-lashes' },
    ]
    for (const item of cases) {
      const category = categories.getByRole('button', { name: item.name, exact: true })
      if (item.key === 'massage') {
        await category.focus()
        await category.press('Space')
      } else {
        await category.click()
      }
      assert.equal(await category.getAttribute('aria-pressed'), 'true')
      const audience = prices.getByRole('group', { name: 'Zobrazit ceny pro', exact: true })
      if (item.rows) {
        assert.equal(await audience.count(), 0)
        assert.equal(await prices.locator('tbody .price-procedure').count(), item.rows)
      } else {
        for (const [label, count] of [['Ženy', item.women], ['Muži', item.men]]) {
          await audience.getByRole('button', { name: label, exact: true }).click()
          assert.equal(await prices.locator('tbody .price-procedure').count(), count)
          if (item.key === 'depilation') {
            const arms = prices.locator('[data-price-id="depilation-arms-full"] .price-value')
            assert.equal(await arms.innerText(), label === 'Ženy' ? '550 Kč' : '750–850 Kč')
            assert.equal(await prices.locator('[data-price-id="depilation-extra-whole-body"]').count(), label === 'Muži' ? 1 : 0)
          }
          await assertPriceLayout(prices, `${width}/${item.key}/${label}`)
        }
      }
      await assertPriceLayout(prices, `${width}/${item.key}`)
      const rows = prices.locator('tbody .price-procedure')
      const bookingLinks = prices.locator('.price-row-booking')
      assert.equal(await bookingLinks.count(), await rows.count())
      assert.equal((await bookingLinks.first().innerText()).trim(), 'Rezervovat')
      for (const href of await bookingLinks.evaluateAll(links => links.map(link => link.getAttribute('href')))) {
        assert.equal(href, 'https://www.termino.eu/r/beauty-studio-litomerice')
      }
      assert.equal(await prices.locator('img').count(), 0)
      const layout = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }))
      assert.ok(layout.content <= layout.width, `Horizontal overflow at ${width}/${item.key}: ${JSON.stringify(layout)}`)
      const columns = await prices.locator('.price-groups').evaluate(grid => getComputedStyle(grid).gridTemplateColumns.split(' ').length)
      assert.equal(columns, width >= 1280 ? 3 : width >= 768 ? 2 : 1)
      const targets = await bookingLinks.evaluateAll(links => links.map(link => ({ width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height })))
      assert.ok(targets.every(target => target.width >= 44 && target.height >= 44), `Undersized booking target at ${width}/${item.key}`)
      await prices.evaluate(section => section.scrollIntoView({ block: 'start' }))
      await page.screenshot({ path: fileURLToPath(new URL(`prices-${width}-${item.key}.png`, output)) })
      if (width === 360 || width === 1280) {
        await prices.locator('.price-group').first().evaluate(group => window.scrollTo({ top: group.getBoundingClientRect().top + scrollY - 105, behavior: 'instant' }))
        await page.screenshot({ path: fileURLToPath(new URL(`prices-${width}-${item.key}-rows.png`, output)) })
      }
      results.push({ width, category: item.key, rows: await rows.count(), columns, horizontalOverflow: false, bookingLabelsVisible: true })
    }
    assert.deepEqual(errors, [], `Browser errors at ${width}`)
    await page.close()
  }
  await writeFile(new URL('browser-results.json', output), JSON.stringify({ passed: true, cases: results }, null, 2))
  console.log(`Passed ${results.length} category/viewport cases, including both audiences where applicable.`)
} finally {
  if (browser) await browser.close()
  await preview.close()
}
