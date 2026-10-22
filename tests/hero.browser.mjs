import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const output = 'reports/hero-two-photos'
const preview = await startPreview()
let browser
const cases = []
await mkdir(output, { recursive: true })

function contrast(foreground, background) {
  const luminance = color => {
    const [r, g, b] = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    })
    return r * .2126 + g * .7152 + b * .0722
  }
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (light + .05) / (dark + .05)
}

try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 375, 390, 767, 768, 1024, 1200, 1280, 1440, 1672]) {
    const page = await browser.newPage({ viewport: { width, height: width < 768 ? 1400 : 941 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(() => {
      window.heroLayoutShift = 0
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.heroLayoutShift += entry.value
      }).observe({ type: 'layout-shift', buffered: true })
    })
    const response = await page.goto(preview.origin, { waitUntil: 'networkidle' })
    assert.equal(response.status(), 200)
    await page.evaluate(() => document.fonts.ready)
    await page.locator('.hero-visual img').evaluateAll(images => Promise.all(images.map(image => image.decode())))
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height, right, bottom } = document.querySelector(selector).getBoundingClientRect()
        return { x, y, width, height, right, bottom }
      }
      const heading = document.querySelector('.hero-copy h1')
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        headingLines: heading.getBoundingClientRect().height / parseFloat(getComputedStyle(heading).lineHeight),
        copy: rect('.hero-copy'), photos: rect('.hero-visual'), highlights: rect('.hero-highlights'),
        mainPhoto: rect('.hero-photo-frame'), candlePhoto: rect('.hero-detail-frame'), bottom: rect('.hero-bottom'),
        clipped: [...document.querySelectorAll('.hero-copy h1, .hero-copy h1 > *, .hero-actions a, .hero-highlights li')].filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.textContent),
        images: [...document.querySelectorAll('.hero-visual img')].map(image => ({ src: image.getAttribute('src'), selected: image.currentSrc, loaded: image.complete && image.naturalWidth > 0, alt: image.alt, loading: image.loading, priority: image.fetchPriority, width: image.width, height: image.height })),
        cls: window.heroLayoutShift,
      }
    })
    await page.screenshot({ path: `${output}/hero-${width}.png`, clip: { x: 0, y: 0, width, height: Math.ceil(layout.bottom.bottom) }, animations: 'disabled' })
    assert.equal(layout.overflow, false, `No overflow at ${width}px`)
    assert.deepEqual(layout.clipped, [], `No clipped heading or controls at ${width}px`)
    assert.ok(Math.abs(layout.headingLines - 2) < .05, `Heading stays on two lines at ${width}px: ${layout.headingLines}`)
    assert.equal(layout.images.length, 2)
    assert.equal(layout.images[0].src, '/images/about/gallery/virgo-5e46a6a8e504.jpg')
    assert.equal(layout.images[1].src, '/images/about/gallery/virgo-f04a78ef8962.webp')
    assert.ok(layout.mainPhoto.width * layout.mainPhoto.height > layout.candlePhoto.width * layout.candlePhoto.height, 'Main photo remains the visual focus')
    for (const photo of [layout.mainPhoto, layout.candlePhoto]) {
      assert.ok(photo.x >= layout.photos.x - 1 && photo.right <= layout.photos.right + 1, 'Photo stays within the composition horizontally')
      assert.ok(photo.y >= layout.photos.y - 1 && photo.bottom <= layout.photos.bottom + 1, 'Photo stays within the composition vertically')
    }
    assert.ok(layout.images.every(image => image.loaded && image.alt && image.selected.includes('/images/optimized/')))
    assert.equal(layout.images[0].loading, 'eager')
    assert.equal(layout.images[0].priority, 'high')
    assert.ok(layout.cls < .01, `No appreciable initial layout shift at ${width}px: ${layout.cls}`)
    if (width < 768) {
      assert.ok(layout.photos.y >= layout.copy.bottom, 'Mobile photos follow the actions')
      assert.ok(layout.highlights.y >= layout.photos.bottom, 'Mobile benefits follow the photos')
      assert.ok(layout.candlePhoto.y >= layout.mainPhoto.bottom + 13, 'Mobile candle card follows the main photo with a clear gap')
      assert.ok(Math.abs(layout.candlePhoto.width - layout.mainPhoto.width) < 1, 'Mobile cards fill the same column')
    } else {
      assert.ok(layout.photos.x >= layout.copy.right, 'Tablet/desktop columns do not overlap')
    }
    const booking = page.locator('.hero-actions .button-gold')
    const expectedBooking = await page.locator('.header-booking').getAttribute('href')
    assert.equal(await booking.getAttribute('href'), expectedBooking)
    assert.equal(await booking.getAttribute('target'), '_blank')
    assert.ok((await booking.getAttribute('rel')).includes('noopener'))
    // Intercept the popup so verifying the real click never contacts Termino.
    await page.context().route('https://www.termino.eu/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Booking link verified</title>' }))
    const popupPromise = page.waitForEvent('popup')
    await booking.click()
    const popup = await popupPromise
    await popup.waitForLoadState('domcontentloaded')
    assert.equal(popup.url(), expectedBooking)
    await popup.close()
    await page.keyboard.press('Tab')
    const focusChecks = []
    for (const selector of ['.hero-actions .button-gold', '.hero-actions .button-outline', '.hero-bottom a']) {
      const link = page.locator(selector)
      await link.focus()
      const style = await link.evaluate(link => ({ focused: document.activeElement === link, outline: getComputedStyle(link).outlineStyle, width: getComputedStyle(link).outlineWidth, color: getComputedStyle(link).color, outlineColor: getComputedStyle(link).outlineColor }))
      const background = await page.locator('.hero-section').evaluate(hero => getComputedStyle(hero).backgroundColor)
      assert.ok(style.focused && style.outline !== 'none' && parseFloat(style.width) >= 2)
      const focusContrast = contrast(style.outlineColor, background)
      assert.ok(focusContrast >= 3)
      if (selector !== '.hero-actions .button-gold') assert.ok(contrast(style.color, background) >= 4.5)
      focusChecks.push({ selector, focusContrast: +focusContrast.toFixed(2) })
    }
    for (const selector of ['.hero-actions .button-outline', '.hero-bottom a']) {
      await page.evaluate(() => { history.replaceState(null, '', '/'); scrollTo(0, 0) })
      await page.locator(selector).focus()
      await page.keyboard.press('Enter')
      await page.waitForURL(`${preview.origin}/#services`)
      const target = await page.locator('#services').boundingBox()
      const header = await page.locator('.site-header').boundingBox()
      assert.ok(target.y >= header.height - 1 && target.y < header.height + 40, `Services target remains visible at ${width}px`)
    }
    assert.deepEqual(errors, [])
    cases.push({ width, ...layout, focusChecks, bookingClick: true, bothServiceLinks: true, errors })
    console.log(`PASS hero ${width}px: two original images, balanced composition, two heading lines, no overflow, CLS ${layout.cls}, booking and service links, keyboard focus.`)
    await page.close()
  }

  const motion = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' })
  await motion.goto(preview.origin, { waitUntil: 'networkidle' })
  assert.equal(await motion.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'smooth')
  await motion.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await motion.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto')
  await motion.screenshot({ path: `${output}/mobile-390-viewport.png`, animations: 'disabled' })
  await motion.close()
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ passed: true, cases, reducedMotion: true }, null, 2) + '\n')
} finally {
  await browser?.close()
  await preview.close()
}
