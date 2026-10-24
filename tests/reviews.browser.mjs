import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

// Run after npm run build: node tests/reviews.browser.mjs
const output = 'reports/qa/reviews'
const expected = JSON.parse(await readFile('tests/fixtures/guestbook-reviews.json', 'utf8'))
const expectedTexts = expected.map(review => review.text)
const total = expected.length
assert.equal(total, 9)
await mkdir(output, { recursive: true })
const preview = await startPreview()
const { origin } = preview
let browser
const results = []
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 360, 375, 390, 430, 767, 768, 1024, 1099, 1100, 1280, 1440, 1920]) {
    const columns = width < 768 ? 1 : width < 1100 ? 2 : 3
    const pages = Math.ceil(total / columns)
    const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce', hasTouch: width < 768 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    // The server snapshot is three columns; hydration applies the actual viewport.
    await page.waitForFunction(expected => document.querySelectorAll('.reviews-page').length === expected, pages)
    const section = page.locator('#reviews')
    const viewport = section.locator('.reviews-viewport')
    const cards = section.locator('.review-card')
    const visibleSlides = section.locator('.reviews-slide:not([inert])')
    const previous = section.getByRole('button', { name: 'Předchozí hodnocení', exact: true })
    const next = section.getByRole('button', { name: 'Další hodnocení', exact: true })
    const dots = section.locator('.reviews-page')
    const status = section.getByRole('status')
    const typography = await page.evaluate(() => {
      const read = selector => {
        const style = getComputedStyle(document.querySelector(selector))
        return Object.fromEntries(['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color'].map(property => [property, style[property]]))
      }
      return {
        reviewTitle: read('#reviews h2'), sectionTitle: read('#services h2'),
        reviewSubtitle: read('#reviews .section-subtitle'), sectionSubtitle: read('#services .section-subtitle'),
        reviewText: read('#reviews blockquote'), bodyText: read('#about .about-copy > p'),
      }
    })
    assert.deepEqual(typography.reviewTitle, typography.sectionTitle, 'Review heading uses the shared section typography')
    assert.deepEqual(typography.reviewSubtitle, typography.sectionSubtitle, 'Review subtitle uses the shared section typography')
    // Confirmed against the unchanged HEAD build: quotes have their own spacing.
    assert.deepEqual(typography.reviewText, { ...typography.bodyText, lineHeight: '29.6px' }, 'Review text preserves its existing typography and quote spacing')
    assert.equal(await cards.count(), total)
    assert.deepEqual(await cards.locator('blockquote > p:first-child').allTextContents(), expectedTexts)
    assert.deepEqual(await cards.locator('.review-service').allTextContents(), expected.map(review => review.service))
    for (let index = 0; index < total; index++) {
      const rating = new Intl.NumberFormat('cs-CZ').format(expected[index].rating)
      assert.equal(await cards.nth(index).locator('.review-rating').getAttribute('aria-label'), `Hodnocení ${rating} z 5`)
      assert.equal(await cards.nth(index).locator('.review-rating-value').textContent(), `${rating} / 5`)
      const fills = await cards.nth(index).locator('.review-star-fill').evaluateAll(fills => fills.map(fill => fill.getBoundingClientRect().width / fill.parentElement.getBoundingClientRect().width))
      const expectedFills = expected[index].rating === 4.5 ? [1, 1, 1, 1, 0.5] : [1, 1, 1, 1, 1]
      fills.forEach((fill, star) => assert.ok(Math.abs(fill - expectedFills[star]) < 0.01))
    }
    assert.equal(await section.getByRole('heading').innerText(), 'Co o nás říkají klienti')
    assert.equal(await section.locator('.eyebrow').innerText(), 'HODNOCENÍ KLIENTŮ')
    assert.equal(await section.locator('.section-subtitle').innerText(), 'Zkušenosti těch, kteří nás navštívili.')
    assert.equal(await section.locator('img').count(), 0)
    assert.equal(await section.locator('time, a').count(), 0)
    assert.equal(await section.locator('.review-source-label').count(), total)
    assert.ok((await section.locator('.review-source-label').allTextContents()).every(label => label.trim() === 'Hodnocení z návštěvní knihy studia'))
    assert.equal(await section.locator('.reviews-source > p').innerText(), 'Vybraná hodnocení z návštěvní knihy našeho studia, zveřejněná se souhlasem jejich autorů.')
    assert.equal(await dots.count(), pages)
    assert.ok((await dots.evaluateAll(dots => dots.map(dot => dot.getBoundingClientRect()).map(rect => ({ width: rect.width, height: rect.height }))))
      .every(target => target.width >= 24 && target.height >= 24), 'Pagination targets meet the WCAG 2.2 minimum size')
    assert.ok(await previous.isDisabled())
    const visited = new Set()
    for (let index = 0; index < pages; index++) {
      const start = Math.min(index * columns, total - columns)
      assert.equal(await visibleSlides.count(), columns)
      assert.equal(await status.innerText(), `Zobrazená hodnocení z výběru: ${start + 1}–${start + columns} / ${total}`)
      assert.equal(await dots.nth(index).getAttribute('aria-current'), 'true')
      const layout = await section.evaluate(section => {
        const viewport = section.querySelector('.reviews-viewport').getBoundingClientRect()
        const slides = [...section.querySelectorAll('.reviews-slide')]
        const visible = slides.filter(slide => {
          const rect = slide.getBoundingClientRect()
          return Math.min(rect.right, viewport.right) - Math.max(rect.left, viewport.left) > 10
        })
        return {
          visibleCount: visible.length,
          fullyVisible: visible.every(slide => {
            const rect = slide.getBoundingClientRect()
            return rect.left >= viewport.left - 1 && rect.right <= viewport.right + 1
          }),
          ratingsVisible: visible.every(slide => {
            const top = slide.querySelector('.review-card-top').getBoundingClientRect()
            return top.top >= viewport.top && top.bottom <= viewport.bottom
          }),
          heights: visible.map(slide => slide.getBoundingClientRect().height),
          footers: visible.map(slide => slide.querySelector('figcaption').getBoundingClientRect().bottom),
          fullText: visible.every(slide => {
            const quote = slide.querySelector('blockquote')
            const footer = slide.querySelector('figcaption').getBoundingClientRect()
            return [...quote.querySelectorAll('p')].every(text => text.scrollHeight <= text.clientHeight + 1 && text.getBoundingClientRect().bottom <= footer.top)
              && getComputedStyle(quote).webkitLineClamp === 'none'
          }),
        }
      })
      assert.equal(layout.visibleCount, columns, `Geometric card count at ${width}, page ${index + 1}`)
      assert.ok(layout.fullyVisible)
      assert.ok(layout.ratingsVisible, `Rating remains in view at ${width}, page ${index + 1}`)
      assert.ok(Math.max(...layout.heights) - Math.min(...layout.heights) < 1)
      assert.ok(Math.max(...layout.footers) - Math.min(...layout.footers) < 1)
      assert.ok(layout.fullText)
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No page overflow at ${width}`)
      for (const text of await visibleSlides.locator('blockquote > p:first-child').allTextContents()) visited.add(text)
      if (index < pages - 1) await next.click()
    }
    assert.equal(visited.size, total, 'Every review is reachable')
    assert.ok(await next.isDisabled())
    assert.ok(await cards.last().getByText(expectedTexts.at(-1), { exact: true }).isVisible())
    if ([390, 1440].includes(width)) await section.screenshot({ path: `${output}/reviews-${width}-last.png`, style: '.site-header, .mobile-booking, .skip-link { visibility: hidden !important; }' })
    await previous.click()
    assert.equal(await dots.nth(pages - 2).getAttribute('aria-current'), 'true')
    await dots.first().click()
    assert.ok(await previous.isDisabled())
    await viewport.focus()
    await page.keyboard.press('ArrowRight')
    assert.equal(await dots.nth(1).getAttribute('aria-current'), 'true')
    await page.keyboard.press('ArrowLeft')
    assert.equal(await dots.first().getAttribute('aria-current'), 'true')
    await page.keyboard.press('End')
    assert.ok(await next.isDisabled())
    await page.keyboard.press('Home')
    assert.ok(await previous.isDisabled())
    await page.keyboard.press('Tab')
    assert.ok(await dots.first().evaluate(button => button === document.activeElement), 'Source labels are plain text and do not enter the tab order')
    const provenance = section.locator('.reviews-provenance')
    await provenance.locator('summary').focus()
    await page.keyboard.press('Enter')
    assert.ok(await provenance.locator('p').isVisible())
    assert.ok((await provenance.locator('p').innerText()).includes('papírová návštěvní kniha'))
    await page.keyboard.press('Enter')
    assert.equal(await provenance.getAttribute('open'), null)
    if (width < 768) {
      await viewport.scrollIntoViewIfNeeded()
      const rect = await viewport.boundingBox()
      const touch = await page.context().newCDPSession(page)
      const swipe = async (from, to) => {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [to] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      }
      const left = { x: rect.x + 45, y: rect.y + 100 }
      const right = { x: rect.x + rect.width - 45, y: rect.y + 103 }
      await swipe(right, left)
      assert.equal(await dots.nth(1).getAttribute('aria-current'), 'true', 'Swipe left advances')
      await swipe(left, right)
      assert.equal(await dots.first().getAttribute('aria-current'), 'true', 'Swipe right returns')
      await swipe(left, { x: left.x + 5, y: left.y + 90 })
      assert.equal(await dots.first().getAttribute('aria-current'), 'true', 'Vertical gesture does not advance')
    }
    await page.mouse.move(0, 0)
    if ([390, 768, 1440].includes(width)) await section.screenshot({ path: `${output}/reviews-${width}.png`, style: '.site-header, .mobile-booking, .skip-link { visibility: hidden !important; }' })
    assert.deepEqual(errors, [])
    console.log(`Passed ${width}px: ${columns} cards, ${pages} pages`)
    results.push({ width, columns, pages, allNineReachable: true, fullTexts: true, exactFractionalRating: true, noDatesOrSourceLinks: true, provenance: true, arrowsAndDots: true, keyboard: true, swipe: width < 768, noOverflow: true, errors })
    await page.close()
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 1100 } })
  await page.goto(origin, { waitUntil: 'networkidle' })
  const section = page.locator('#reviews')
  const track = section.locator('.reviews-track')
  assert.ok(parseFloat(await track.evaluate(track => getComputedStyle(track).transitionDuration)) > 0)
  const initialStatus = await section.getByRole('status').innerText()
  await delay(1500)
  assert.equal(await section.getByRole('status').innerText(), initialStatus, 'No automatic advance')
  await section.locator('.reviews-viewport').focus()
  await page.keyboard.press('End')
  await delay(500)
  await page.setViewportSize({ width: 1440, height: 1100 })
  await delay(500)
  assert.equal(await section.locator('.reviews-slide:not([inert])').count(), 3)
  assert.equal(await section.locator('.reviews-page').count(), 3)
  assert.ok(await section.getByText(expectedTexts.at(-1), { exact: true }).isVisible())
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.ok(parseFloat(await track.evaluate(track => getComputedStyle(track).transitionDuration)) <= 0.00001, 'Reduced motion removes any perceptible transition')
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ results, noAutoplay: true, responsiveResize: true, reducedMotion: true }, null, 2) + '\n')
  console.log(JSON.stringify({ results, noAutoplay: true, responsiveResize: true, reducedMotion: true }, null, 2))
} finally {
  await browser?.close()
  await preview.close()
}
