import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const output = 'reports/contact-layout'
await mkdir(output, { recursive: true })
const server = await createServer({
  envFile: false, logLevel: 'error', cacheDir: 'node_modules/.vite-contact-layout',
  define: { 'import.meta.env.VITE_CONTACT_MODE': JSON.stringify('mock') },
  server: { host: '127.0.0.1', port: 0, open: false, hmr: false, watch: null },
})
let browser
const results = []
try {
  await server.listen()
  const { site, getGoogleMapsUrl } = await server.ssrLoadModule('/src/data/site.ts')
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1050 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const section = page.locator('#contact')
    await section.scrollIntoViewIfNeeded()
    assert.equal(await section.locator('.contact-info-card').count(), 3)
    assert.equal(await section.locator('address').innerText(), site.location.fullAddress)
    for (const href of [site.contact.phoneHref, site.contact.emailHref, getGoogleMapsUrl()]) {
      assert.equal(await section.locator(`a[href="${href}"]`).count(), 1)
    }
    const booking = section.locator('a[href*="termino.eu"]')
    assert.equal(await booking.count(), 1, 'One integrated booking CTA')
    assert.equal(await booking.getAttribute('href'), site.links.booking)
    assert.equal(await booking.getAttribute('target'), '_blank')
    assert.deepEqual(await section.locator('.contact-hours-grid > div').evaluateAll(rows => rows.map(row => ({
      day: row.querySelector('dt').textContent, hours: row.querySelector('dd').textContent,
    }))), site.openingHours)
    assert.equal(await section.locator('.contact-hours-note').innerText(), site.hoursNote)
    const layout = await section.evaluate(section => {
      const box = selector => section.querySelector(selector).getBoundingClientRect()
      const copy = box('.contact-copy'), form = box('.contact-form')
      const name = box('#contact-name'), email = box('#contact-email')
      const cards = [...section.querySelectorAll('.contact-info-card')].map(card => card.getBoundingClientRect())
      return {
        columns: form.x > copy.x + copy.width ? 2 : 1,
        fields: Math.abs(name.y - email.y) < 1 ? 2 : 1,
        cards: Math.abs(cards[0].y - cards[2].y) < 1 ? 3 : 1,
        formAfterCopy: form.y >= copy.bottom,
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...section.querySelectorAll('h2, h3, a, input, select, textarea')]
          .filter(element => element.scrollWidth > element.clientWidth + 1 && element.tagName !== 'SELECT')
          .map(element => element.className || element.id),
      }
    })
    assert.equal(layout.columns, width >= 1100 ? 2 : 1, `Section columns at ${width}`)
    assert.equal(layout.fields, width >= 768 ? 2 : 1, `Form columns at ${width}`)
    assert.equal(layout.cards, width >= 768 ? 3 : 1, `Contact cards at ${width}`)
    if (width < 1100) assert.ok(layout.formAfterCopy, 'Contact information precedes the form')
    assert.equal(layout.overflow, false, `Page fits at ${width}`)
    assert.deepEqual(layout.clipped, [], `Contact content fits at ${width}`)
    await booking.focus()
    assert.notEqual(await booking.evaluate(element => getComputedStyle(element).outlineStyle), 'none')
    await booking.evaluate(element => element.blur())
    await section.screenshot({ path: `${output}/contact-${width}.png`, animations: 'disabled',
      style: '.site-header, .mobile-booking, .skip-link { visibility: hidden; }' })
    assert.deepEqual(errors, [])
    results.push({ width, ...layout })
    await page.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ passed: true, results }, null, 2))
  console.log(`Contact layout, data, links and keyboard focus verified at ${results.length} widths.`)
} finally {
  if (browser) await browser.close()
  await server.close()
}
