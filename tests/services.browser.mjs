import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { startPreview } from './helpers/preview.mjs'

// Run against the production build: node tests/services.browser.mjs
const output = 'reports/qa/services'
await mkdir(output, { recursive: true })
const modules = await createServer({ envFile: false, appType: 'custom', logLevel: 'error', cacheDir: 'node_modules/.vite-services', server: { middlewareMode: true, hmr: false, watch: null } })
let categories, site, content, serviceDetailPages
try {
  ;({ categories, site, content } = await modules.ssrLoadModule('/src/data/index.ts'))
  ;({ serviceDetailPages } = await modules.ssrLoadModule('/src/data/serviceDetails.ts'))
} finally { await modules.close() }
categories = [...categories].sort((a, b) => a.order - b.order)
const preview = await startPreview()
let browser
const results = []
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 375, 390, 767, 768, 1024, 1199, 1200, 1440, 1672]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce', hasTouch: width < 768 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(preview.origin, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    const section = page.locator('#services')
    await section.scrollIntoViewIfNeeded()
    await section.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
    const cards = section.locator('.service-card')
    assert.equal(await cards.count(), 4)
    assert.deepEqual(await cards.locator('h3').allTextContents(), categories.map(category => category.title))
    assert.deepEqual(await cards.locator('.service-card-body > p').allTextContents(), categories.map(category => category.summary))
    assert.equal(await section.locator('h2').innerText(), content.sections.servicesTitle)
    assert.equal(await section.locator('.eyebrow').innerText(), 'SLUŽBY')
    for (let index = 0; index < 4; index++) {
      const card = cards.nth(index)
      const link = card.locator('.service-learn-more')
      const route = serviceDetailPages.find(detail => detail.categoryId === categories[index].id).path
      assert.equal(await link.getAttribute('href'), route)
      const booking = card.locator('.button')
      assert.equal(await booking.innerText(), content.sections.serviceBooking)
      assert.equal(await booking.getAttribute('href'), site.links.booking)
      assert.equal(await booking.getAttribute('target'), '_blank')
      assert.equal(await booking.getAttribute('rel'), 'noopener noreferrer')
      assert.equal(await booking.getAttribute('aria-label'), `${content.sections.serviceBooking}: ${categories[index].title}`)
      assert.ok(await card.locator('img').evaluate(image => image.complete && image.naturalWidth > 0 && getComputedStyle(image).objectFit === 'cover'))
      await link.focus()
      await page.keyboard.press('Tab')
      assert.ok(await booking.evaluate(element => element === document.activeElement && element.matches(':focus-visible')))
      const outline = await booking.evaluate(element => {
        const style = getComputedStyle(element)
        return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor }
      })
      assert.equal(outline.style, 'solid')
      assert.ok(parseFloat(outline.width) >= 3)
      // Exercise the actual booking click while fulfilling its new tab locally.
      await page.context().route(site.links.booking, route => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Booking destination verified</title>' }))
      const popupPromise = page.waitForEvent('popup')
      await booking.click()
      const popup = await popupPromise
      await popup.waitForLoadState()
      assert.equal(popup.url(), site.links.booking)
      await popup.close()
      await page.context().unroute(site.links.booking)
    }
    await page.mouse.move(0, 0)
    await page.evaluate(() => document.activeElement.blur())
    const layout = await section.evaluate(section => {
      const rect = element => {
        const { x, y, width, height, bottom } = element.getBoundingClientRect()
        return { x, y, width, height, bottom }
      }
      return {
        columns: getComputedStyle(section.querySelector('.services-grid')).gridTemplateColumns.split(' ').length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        cards: [...section.querySelectorAll('.service-card')].map(card => ({
          bounds: rect(card), button: rect(card.querySelector('.button')), icon: rect(card.querySelector('.service-icon')),
          texts: [...card.querySelectorAll('h3, p, a')].map(element => ({
            text: element.textContent, bounds: rect(element), clipped: element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 3,
          })),
        })),
      }
    })
    const columns = width < 768 ? 1 : width < 1200 ? 2 : 4
    const contrastResults = []
    if ([320, 390, 768, 1440, 1672].includes(width)) {
      await section.screenshot({ path: `${output}/services-${width}.png`, animations: 'disabled', style: '.site-header, .mobile-booking, .skip-link { visibility: hidden !important; }' })
    }
    assert.equal(layout.columns, columns, `Column count at ${width}`)
    assert.equal(layout.overflow, false, `No horizontal overflow at ${width}`)
    for (let start = 0; start < 4; start += columns) {
      const row = layout.cards.slice(start, start + columns)
      assert.ok(Math.max(...row.map(card => card.bounds.height)) - Math.min(...row.map(card => card.bounds.height)) < 1, `Equal heights at ${width}`)
      assert.ok(Math.max(...row.map(card => card.button.y)) - Math.min(...row.map(card => card.button.y)) < 1, `Aligned booking buttons at ${width}`)
    }
    for (const card of layout.cards) {
      for (const text of card.texts) {
        assert.equal(text.clipped, false, `Text fits at ${width}: ${JSON.stringify(text)}`)
        assert.ok(text.bounds.bottom <= card.bounds.bottom - 12, `Text inside card at ${width}`)
      }
      assert.ok(card.button.height >= 48)
      assert.ok(card.icon.width === (width < 768 ? 44 : 52))
    }
    if ([320, 1440].includes(width)) {
      for (const card of await cards.all()) {
        const samples = await card.evaluate(card => {
          const bounds = card.getBoundingClientRect()
          return [...card.querySelectorAll('h3, .service-card-body > p, .service-learn-more, .button span')].map(element => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return { text: element.textContent, x: rect.x - bounds.x, y: rect.y - bounds.y, width: rect.width, height: rect.height, color: style.color.match(/[\d.]+/g).map(Number), threshold: element.tagName === 'H3' ? 3 : 4.5 }
          })
        })
        // Rasterize the actual photo and CSS gradient with the text hidden, then
        // measure contrast across every text area, including translucent colors.
        const background = await card.screenshot({ style: '.service-card h3, .service-card-body > p, .service-learn-more, .service-card .button span { visibility: hidden !important; }' })
        const contrast = await page.evaluate(async ({ base64, samples }) => {
          const image = new Image()
          image.src = `data:image/png;base64,${base64}`
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.width; canvas.height = image.height
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0)
          const luminance = rgb => rgb.slice(0, 3).map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0)
          return samples.map(sample => {
            let minimum = Infinity
            for (let x = Math.ceil(sample.x); x < sample.x + sample.width - 1; x += 4) {
              for (let y = Math.ceil(sample.y); y < sample.y + sample.height - 1; y += 4) {
                const background = [...context.getImageData(x, y, 1, 1).data]
                const alpha = sample.color[3] ?? 1
                const foreground = sample.color.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha))
                const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
                minimum = Math.min(minimum, (values[0] + .05) / (values[1] + .05))
              }
            }
            return { text: sample.text, minimum, threshold: sample.threshold }
          })
        }, { base64: background.toString('base64'), samples })
        for (const sample of contrast) assert.ok(sample.minimum >= sample.threshold, `Text contrast at ${width}: ${JSON.stringify(sample)}`)
        contrastResults.push(...contrast)
      }
    }
    assert.deepEqual(errors, [])
    results.push({ width, ...layout, contrast: contrastResults, errors })
    await page.close()
  }

  // Actual navigation verifies all four detail routes and their visible headings.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  for (const category of categories) {
    await page.goto(preview.origin, { waitUntil: 'networkidle' })
    await page.getByRole('link', { name: `${content.common.learnMore}: ${category.title}`, exact: true }).click()
    const detail = serviceDetailPages.find(detail => detail.categoryId === category.id)
    await page.waitForURL(preview.origin + detail.path)
    assert.equal(await page.locator('main h1').innerText(), category.title)
  }

  await page.goto(preview.origin, { waitUntil: 'networkidle' })
  await page.locator('#services').scrollIntoViewIfNeeded()
  const card = page.locator('.service-card').first()
  const before = await card.boundingBox()
  await card.hover()
  await page.waitForTimeout(350)
  const after = await card.boundingBox()
  assert.ok(Math.abs(after.y - before.y + 4) < 1, 'Card lifts four pixels')
  assert.equal(after.height, before.height, 'Hover preserves layout size')
  assert.ok(await card.locator('img').evaluate(image => getComputedStyle(image).transform.startsWith('matrix(1.03,')))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.waitForTimeout(50)
  assert.equal(await card.evaluate(card => getComputedStyle(card).transform), 'none')
  assert.equal(await card.locator('img').evaluate(image => getComputedStyle(image).transform), 'none')
  await card.locator('.button').hover()
  assert.equal(await card.locator('.button').evaluate(button => getComputedStyle(button).transform), 'none')
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ passed: true, cases: results, routes: true, bookingClicks: true, keyboard: true, hover: true, reducedMotion: true }, null, 2) + '\n')
  console.log(`Services: ${results.length} viewport checks, four detail routes, booking clicks, keyboard focus, hover and reduced motion passed.`)
} finally {
  await browser?.close()
  await preview.close()
}
