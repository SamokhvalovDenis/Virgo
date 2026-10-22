import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

// Run after npm run build: node tests/about.browser.mjs
const output = 'reports/qa/about-gallery'
await mkdir(output, { recursive: true })
const source = JSON.parse(await readFile('reports/about-gallery/source-images.json', 'utf8'))
assert.equal(source.length, 6)
const hashes = await Promise.all(source.map(async image => createHash('sha256').update(await readFile(`public${image.file}`)).digest('hex')))
assert.equal(new Set(hashes).size, 6, 'All six source photographs are distinct')
const preview = await startPreview()
const { origin } = preview
let browser
const results = []
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', hasTouch: width < 768 })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    // Hold photographs on the requested viewports to verify space is reserved before they load.
    const checkStability = [320, 390, 768, 1440].includes(width)
    let releaseImages
    if (checkStability) {
      const imagesReady = new Promise(resolve => { releaseImages = resolve })
      await page.route('**/images/**', async route => { await imagesReady; await route.continue() })
    }
    const response = await page.goto(origin, { waitUntil: checkStability ? 'domcontentloaded' : 'networkidle' })
    assert.equal(response.status(), 200)
    await page.evaluate(() => document.fonts.ready)
    const section = page.locator('#about')
    const gallery = section.getByRole('group', { name: 'Fotogalerie studia Virgo' })
    const tiles = gallery.getByRole('button')
    assert.equal(await tiles.count(), 6)
    assert.equal(await section.locator('.about-copy > p').count(), 2)
    assert.equal(await section.locator('.about-values li').count(), 3)
    assert.equal(await section.getByRole('heading').innerText(), 'Příjemné místo pro chvíle odpočinku')
    assert.equal(await section.locator('.about-copy > p').nth(0).innerText(), 'Ve Virgo Beauty Studio klademe důraz na individuální přístup, příjemnou atmosféru a péči pro ženy i muže.')
    assert.equal(await section.locator('.about-copy > p').nth(1).innerText(), 'Ať už hledáte chvíli odpočinku při masáži, depilaci nebo úpravu obočí a řas, vyberte si péči podle svých potřeb. Těšíme se na vás v Litoměřicích.')
    const booking = section.getByRole('link', { name: 'Rezervovat termín' })
    assert.equal(await booking.count(), 1)
    assert.equal(await booking.getAttribute('href'), await page.locator('.site-header .header-booking').getAttribute('href'))
    const geometry = () => section.evaluate(section => {
      const sectionTop = section.getBoundingClientRect().top
      return [...section.querySelectorAll('.about-booking, .about-gallery-tile')].map(element => {
        const { x, y, width, height } = element.getBoundingClientRect()
        return [x, y - sectionTop, width, height].map(value => Math.round(value * 100) / 100)
      })
    })
    const beforeImages = checkStability ? await geometry() : undefined
    if (checkStability) {
      assert.ok(await gallery.getByRole('img').evaluateAll(images => images.every(image => !image.complete)), 'Photographs are still loading during the initial layout check')
      releaseImages()
    }
    for (const image of await gallery.getByRole('img').all()) {
      await image.scrollIntoViewIfNeeded()
      await image.evaluate(image => image.decode())
    }
    if (checkStability) assert.deepEqual(await geometry(), beforeImages, `Photos and booking button stay in place after image loading at ${width}px`)
    const bookingBounds = await booking.boundingBox()
    assert.ok(Math.abs(bookingBounds.x + bookingBounds.width / 2 - width / 2) < 1, 'Booking CTA is centered')
    const benefitBounds = await section.locator('.about-values li').evaluateAll(items => items.map(item => item.getBoundingClientRect().top))
    if (width >= 768) assert.ok(benefitBounds.every(top => Math.abs(top - benefitBounds[0]) < 1), 'Desktop and tablet benefits form one row')
    else assert.ok(benefitBounds.every((top, index) => index === 0 || top > benefitBounds[index - 1]), 'Mobile benefits have comfortable vertical spacing')
    const photos = await gallery.getByRole('img').evaluateAll(images => images.map(image => ({
      src: image.getAttribute('src'), alt: image.alt, loaded: image.complete && image.naturalWidth > 0,
    })))
    assert.ok(photos.every(image => image.loaded && image.alt && source.some(source => source.thumbnail === image.src)))
    assert.equal(new Set(photos.map(image => image.src)).size, 6)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow at ${width}`)
    const bounds = await tiles.evaluateAll(tiles => tiles.map(tile => {
      const { x, y, width, height } = tile.getBoundingClientRect()
      return { x, y, width, height }
    }))
    assert.ok(bounds.every(tile => tile.width >= 130 && tile.height >= 130))
    if (width >= 768) {
      assert.ok(bounds[0].width > bounds[1].width * 1.9)
      assert.ok(bounds[0].height > bounds[1].height * 1.9)
      assert.equal(bounds[1].x, bounds[2].x)
      assert.ok(bounds[2].y > bounds[1].y)
      assert.ok(Math.abs(bounds[3].y - bounds[4].y) < 1 && Math.abs(bounds[4].y - bounds[5].y) < 1)
    } else {
      assert.ok(bounds[0].width > bounds[1].width * 1.9)
      assert.ok(Math.abs(bounds[1].y - bounds[2].y) < 1)
      assert.ok(Math.abs(bounds[3].y - bounds[4].y) < 1)
      assert.equal(bounds[5].width, bounds[0].width)
    }
    // Isolate the section in screenshots without fixed site navigation covering it.
    await section.screenshot({ path: `${output}/about-${width}.png`, style: '.site-header, .mobile-booking, .skip-link { visibility: hidden !important; }' })
    const originalOverflow = await page.evaluate(() => document.body.style.overflow)
    const originalPadding = await page.evaluate(() => document.body.style.paddingRight)
    for (let index = 0; index < 6; index++) {
      const tile = tiles.nth(index)
      await tile.focus()
      await tile.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Fotogalerie studia Virgo' })
      await dialog.waitFor({ state: 'visible' })
      assert.equal(await dialog.getByRole('status').innerText(), `${index + 1} / 6`)
      assert.equal(await dialog.getAttribute('aria-modal'), 'true')
      const photo = dialog.getByRole('img')
      await photo.evaluate(image => image.decode())
      assert.equal(await photo.getAttribute('src'), source.find(image => image.thumbnail === photos[index].src).file)
      assert.equal(await photo.evaluate(image => getComputedStyle(image).objectFit), 'contain')
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
      const close = dialog.getByRole('button', { name: 'Zavřít fotogalerii' })
      assert.ok(await close.evaluate(button => button === document.activeElement))
      await page.keyboard.press('Shift+Tab')
      assert.ok(await dialog.getByRole('button', { name: 'Další fotografie' }).evaluate(button => button === document.activeElement), 'Reverse focus stays in modal')
      await page.keyboard.press('Tab')
      assert.ok(await close.evaluate(button => button === document.activeElement), 'Forward focus wraps in modal')
      await page.keyboard.press('ArrowRight')
      assert.equal(await dialog.getByRole('status').innerText(), `${(index + 1) % 6 + 1} / 6`)
      await page.keyboard.press('ArrowLeft')
      assert.equal(await dialog.getByRole('status').innerText(), `${index + 1} / 6`)
      await dialog.getByRole('button', { name: 'Předchozí fotografie' }).click()
      assert.equal(await dialog.getByRole('status').innerText(), `${(index + 5) % 6 + 1} / 6`)
      await dialog.getByRole('button', { name: 'Další fotografie' }).click()
      if (index === 0 && [390, 1440].includes(width)) {
        await photo.evaluate(image => image.decode())
        await page.screenshot({ path: `${output}/lightbox-${width}.png` })
      }
      if (index === 2) await close.click()
      else await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('dialog').count(), 0)
      assert.ok(await tile.evaluate(button => button === document.activeElement), 'Focus returns to opening photo')
      assert.equal(await page.evaluate(() => document.body.style.overflow), originalOverflow)
      assert.equal(await page.evaluate(() => document.body.style.paddingRight), originalPadding)
    }
    await tiles.first().click()
    const dialog = page.getByRole('dialog')
    if (width < 768) {
      const touch = await page.context().newCDPSession(page)
      const swipe = async (from, to) => {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [to] })
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      }
      await swipe({ x: 250, y: 200 }, { x: 80, y: 205 })
      assert.equal(await dialog.getByRole('status').innerText(), '2 / 6')
      await swipe({ x: 80, y: 200 }, { x: 250, y: 205 })
      assert.equal(await dialog.getByRole('status').innerText(), '1 / 6')
      // Vertical gestures must not turn the photo.
      await swipe({ x: 80, y: 100 }, { x: 85, y: 300 })
      assert.equal(await dialog.getByRole('status').innerText(), '1 / 6')
    }
    const scrollBefore = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 600)
    await delay(100)
    assert.equal(await page.evaluate(() => window.scrollY), scrollBefore, 'Background scroll is locked')
    await page.mouse.click(4, 76)
    assert.equal(await page.getByRole('dialog').count(), 0, 'Clicking the backdrop closes the modal')
    assert.ok(await tiles.first().evaluate(button => button === document.activeElement))
    assert.deepEqual(errors, [])
    results.push({ width, photos: photos.length, distinct: true, layout: width < 768 ? 'mobile grid' : 'desktop bento', centeredCta: true, stableDuringImageLoad: checkStability ? true : 'not checked', allSixOpen: true, navigation: true, focusTrapAndRestore: true, scrollLock: true, swipe: width < 768, noOverflow: true, errors })
    await page.close()
  }
  // Check hover in the normal animation mode as well as reduced-motion handling.
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto(origin)
  const tile = page.locator('.about-gallery-tile').first()
  await tile.hover()
  await delay(350)
  assert.notEqual(await tile.locator('img').evaluate(image => getComputedStyle(image).transform), 'none')
  assert.equal(await tile.locator('.about-gallery-expand').evaluate(icon => getComputedStyle(icon).opacity), '1')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await tile.locator('img').evaluate(image => getComputedStyle(image).transform), 'none')
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ results, hover: true, reducedMotion: true }, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser?.close()
  await preview.close()
}
