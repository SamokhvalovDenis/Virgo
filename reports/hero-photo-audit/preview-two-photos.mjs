import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from '../../tests/helpers/preview.mjs'

// Review-only proposal: alter the browser DOM without modifying application files.
const preview = await startPreview()
const browser = await chromium.launch({ headless: true })
const cases = []
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1400 }, reducedMotion: 'reduce' })
    await page.goto(preview.origin, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.hero-visual img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
    const original = await page.locator('.hero-visual img').evaluateAll(images => images.map(image => image.currentSrc))
    await page.evaluate(() => document.querySelector('.hero-detail-frame-2').remove())
    await page.addStyleTag({ content: '@media(max-width:767px){.hero-detail-frame-1{grid-column:1/-1;aspect-ratio:2.2}}' })
    const result = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      sources: [...document.querySelectorAll('.hero-visual img')].map(image => image.currentSrc),
      loaded: [...document.querySelectorAll('.hero-visual img')].every(image => image.complete && image.naturalWidth > 0),
    }))
    assert.equal(result.overflow, false)
    assert.equal(result.loaded, true)
    assert.deepEqual(result.sources, original.slice(0, 2))
    const bottom = await page.locator('.hero-bottom').boundingBox()
    await page.screenshot({ path: `reports/hero-photo-audit/proposal-${width}.png`, clip: { x: 0, y: 0, width, height: Math.ceil(bottom.y + bottom.height) } })
    cases.push({ width, ...result })
    await page.close()
  }
  await writeFile('reports/hero-photo-audit/proposal-results.json', JSON.stringify({ proposalOnly: true, applicationFilesChanged: false, cases }, null, 2))
  console.log('Two-photo proposal verified at 320, 390, 768 and 1440px: original main/candle sources, loaded images, no horizontal overflow. Application files unchanged.')
} finally {
  await browser.close()
  await preview.close()
}
