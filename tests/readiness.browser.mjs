import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

// Use a production build. Exercise the requested widths on every service route.
const widths = [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]
const routes = ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']
const bookingUrl = 'https://www.termino.eu/r/beauty-studio-litomerice'
const output = 'reports/prelaunch/responsive'
await mkdir(output, { recursive: true })
const preview = await startPreview()
const browser = await chromium.launch({ headless: true })
const results = []

function contrastRatio(first, second) {
  const luminance = color => {
    const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    })
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a)
  return (values[0] + .05) / (values[1] + .05)
}

try {
  for (const width of widths) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width < 768 })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const response = await page.goto(preview.origin + route, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200, `${route} responds successfully`)
      await page.evaluate(() => document.fonts.ready)
      assert.equal(await page.locator('main h1').count(), 1)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}${route}`)
      const clippedText = await page.locator('h1, h2, h3, .button, .service-learn-more').evaluateAll(elements => elements
        .filter(element => element.getBoundingClientRect().width > 0 && element.scrollWidth > element.clientWidth + 1)
        .map(element => element.textContent.trim()))
      assert.deepEqual(clippedText, [], `Headings and buttons fit at ${width}${route}`)
      const logos = page.locator('.brand-logo')
      assert.equal(await logos.count(), 2)
      assert.equal(await logos.first().getAttribute('src'), await logos.last().getAttribute('src'), 'Header and footer preserve the original logo')
      const logoBounds = await logos.first().boundingBox()
      assert.ok(logoBounds.x >= 0 && logoBounds.x + logoBounds.width <= width, 'Logo fits the viewport')
      const bookings = page.locator(`a[href="${bookingUrl}"]`)
      assert.ok(await bookings.count() > 0)
      for (const attributes of await page.locator('a[target="_blank"]').evaluateAll(links => links.map(link => ({ href: link.href, rel: link.rel })))) {
        assert.ok(attributes.rel.split(/\s+/).includes('noopener'), `Safe external link: ${attributes.href}`)
      }

      await page.keyboard.press('Tab')
      assert.ok(await page.locator('.skip-link').evaluate(link => link === document.activeElement), 'Skip link is the first keyboard stop')
      await page.keyboard.press('Enter')
      assert.ok(await page.locator('main').evaluate(main => main === document.activeElement), 'Skip link moves focus to main content')

      const toggle = page.locator('.menu-toggle')
      const menu = page.locator('#mobile-menu')
      if (width < 1100) {
        await toggle.focus()
        await page.keyboard.press('Enter')
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
        assert.ok(await menu.isVisible())
        const bounds = await menu.boundingBox()
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= 900, 'Menu fits the viewport')
        await page.keyboard.press('Escape')
        assert.ok(await menu.isHidden())
        assert.ok(await toggle.evaluate(button => button === document.activeElement), 'Escape returns focus to menu button')
        await toggle.click()
        await menu.locator('a').last().focus()
        await page.keyboard.press('Tab')
        assert.ok(await menu.isHidden(), 'Leaving the header with the keyboard closes the menu')
        await toggle.click()
        await page.locator('.site-header .brand').focus()
        await page.keyboard.press('Shift+Tab')
        assert.ok(await menu.isHidden(), 'Reverse keyboard navigation out of the header closes the menu')
        await toggle.click()
        await menu.locator('a[href="/#services"]').click()
        await page.waitForURL(`${preview.origin}/#services`)
        assert.ok(await menu.isHidden(), 'Following a mobile navigation link closes the menu')
        const section = await page.locator('#services').boundingBox()
        const header = await page.locator('.site-header').boundingBox()
        assert.ok(section.y >= header.y + header.height - 1, 'Sticky header does not cover the destination heading')
      } else {
        assert.ok(await toggle.isHidden())
        assert.ok(await page.locator('.desktop-nav').isVisible())
      }

      if (route === '/' && [320, 390, 768, 1440].includes(width)) {
        await page.goto(preview.origin, { waitUntil: 'networkidle' })
        await page.screenshot({ path: `${output}/home-${width}.png` })
      }
      if (width === 390 && route !== '/') {
        await page.goto(preview.origin + route, { waitUntil: 'networkidle' })
        const reload = await page.reload({ waitUntil: 'networkidle' })
        assert.equal(reload.status(), 200, 'Direct service page survives a reload')
        await page.screenshot({ path: `${output}/${route.split('/').at(-1)}-390.png` })
      }
      assert.deepEqual(errors, [], `No browser exceptions at ${width}${route}`)
      results.push({ width, route, status: 200, oneH1: true, noOverflow: true, textFits: true, logoPreserved: true, skipLink: true, menu: width < 1100 ? 'keyboard, Escape, blur and link passed' : 'desktop navigation visible', pageErrors: errors })
      await page.close()
    }
  }

  const page = await browser.newPage({ viewport: { width: 320, height: 480 }, reducedMotion: 'reduce' })
  await page.goto(preview.origin, { waitUntil: 'networkidle' })
  await page.locator('.menu-toggle').click()
  const menu = page.locator('#mobile-menu')
  await menu.locator('a').last().scrollIntoViewIfNeeded()
  const lastLink = await menu.locator('a').last().boundingBox()
  assert.ok(lastLink.y >= 0 && lastLink.y + lastLink.height <= 480, 'Booking remains reachable in a short mobile menu')
  await page.keyboard.press('Escape')
  const focusContrast = []
  for (const [controlSelector, surfaceSelector] of [['.hero-actions .button', '.hero-section'], ['.service-learn-more', '.service-card']]) {
    const control = page.locator(controlSelector).first()
    await control.focus()
    const foreground = await control.evaluate(control => getComputedStyle(control).outlineColor)
    const background = await page.locator(surfaceSelector).first().evaluate(surface => getComputedStyle(surface).backgroundColor)
    const ratio = contrastRatio(foreground, background)
    assert.ok(ratio >= 3, `Keyboard focus contrasts with ${surfaceSelector}: ${ratio}`)
    focusContrast.push({ surface: surfaceSelector, ratio: +ratio.toFixed(2) })
  }
  const dotColor = await page.locator('.reviews-page').nth(1).locator('span').evaluate(dot => getComputedStyle(dot).backgroundColor)
  const reviewsColor = await page.locator('.reviews-section').evaluate(section => getComputedStyle(section).backgroundColor)
  const paginationContrast = contrastRatio(dotColor, reviewsColor)
  assert.ok(paginationContrast >= 3, 'Inactive review pagination remains distinguishable')
  const anchorProblems = await page.locator('a[href^="#"], a[href^="/#"]').evaluateAll(links => links
    .map(link => link.getAttribute('href').split('#')[1])
    .filter(id => id && !document.getElementById(id)))
  assert.deepEqual(anchorProblems, [], 'All section links have a destination')
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ passed: true, cases: results, shortMobileMenu: true, sectionLinks: true, focusContrast, paginationContrast: +paginationContrast.toFixed(2) }, null, 2) + '\n')
  console.log(`Passed ${results.length} route/viewport cases, menu and keyboard checks, plus the short mobile viewport.`)
} finally {
  await browser.close()
  await preview.close()
}
