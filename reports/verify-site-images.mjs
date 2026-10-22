import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const origin = 'http://127.0.0.1:4176'
const output = new URL('./image-selection/', import.meta.url)
await mkdir(output, { recursive: true })
const preview = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { windowsHide: true, stdio: 'pipe' })
let logs = ''
preview.stdout.on('data', chunk => { logs += chunk })
preview.stderr.on('data', chunk => { logs += chunk })
let browser
const results = []
try {
  let ready = false
  for (let attempt = 0; attempt < 50; attempt++) {
    if (preview.exitCode !== null) throw new Error(logs)
    try { if ((await fetch(origin)).ok) { ready = true; break } } catch { /* Starting. */ }
    await delay(200)
  }
  assert.ok(ready, logs)
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(origin, { waitUntil: 'networkidle' })
    for (const id of ['hero', 'services', 'about', 'gifts']) {
      const section = page.locator(id === 'hero' ? '.hero-section' : `#${id}`)
      await section.scrollIntoViewIfNeeded()
      for (const photo of await section.locator('img').all()) {
        await photo.scrollIntoViewIfNeeded()
        await photo.evaluate(image => image.decode())
        const actual = await photo.evaluate(image => ({ src: image.getAttribute('src'), alt: image.alt, naturalWidth: image.naturalWidth, width: image.width, height: image.height, loading: image.loading }))
        assert.ok(actual.src.startsWith('/images/'))
        assert.ok(actual.alt.length > 10)
        assert.ok(actual.naturalWidth > 0 && actual.width > 0 && actual.height > 0)
        assert.equal(actual.loading, id === 'hero' ? 'eager' : 'lazy')
        if (id === 'hero') assert.equal(await photo.getAttribute('fetchpriority'), 'high')
        results.push({ viewport: width, section: id, ...actual })
      }
      await section.screenshot({ path: fileURLToPath(new URL(`${id}-${width}.png`, output)) })
    }
    assert.equal(await page.locator('img').count(), 8)
    const header = page.locator('.site-header')
    const logo = header.locator('.brand-logo')
    await logo.evaluate(image => image.decode())
    const logoLayout = await logo.evaluate(image => ({ width: image.width, height: image.height, fit: getComputedStyle(image).objectFit, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight }))
    assert.equal(logoLayout.fit, 'contain')
    assert.equal(logoLayout.width / logoLayout.height, logoLayout.naturalWidth / logoLayout.naturalHeight)
    assert.equal(logoLayout.width, width < 768 ? 80 : 100)
    assert.equal(await logo.getAttribute('src'), '/images/logo.png')
    assert.equal(await header.locator('.brand-symbol, .brand-type').count(), 0)
    assert.equal(await header.locator('.brand').getAttribute('href'), '/')
    assert.equal((await header.boundingBox()).height, width < 768 ? 77 : 87)
    if (width < 1100) {
      await header.locator('.menu-toggle').click()
      assert.ok(await page.locator('#mobile-menu').isVisible())
      await header.locator('.menu-toggle').press('Escape')
      assert.equal(await page.locator('#mobile-menu').isVisible(), false)
    } else {
      assert.ok(await header.locator('.desktop-nav').isVisible())
      assert.ok(await header.locator('.header-booking').isVisible())
    }
    await header.screenshot({ path: fileURLToPath(new URL(`header-${width}.png`, output)) })
    assert.equal(await page.locator('.hero-arch').isVisible(), false)
    const copy = await page.locator('.hero-copy').boundingBox()
    const photo = await page.locator('.hero-photo').boundingBox()
    if (width >= 768) assert.ok(copy.x + copy.width <= photo.x, 'Hero copy must stay to the left of the photo')
    else assert.ok(copy.y + copy.height <= photo.y, 'Mobile hero photo must follow the copy')
    assert.equal(await page.locator('.about-art-text').isVisible(), false)
    assert.equal(await page.locator('.gift-card-model').isVisible(), false)
    assert.equal(await page.locator('.gift-caption').isVisible(), false)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(errors, [])
    await header.locator('.brand').click()
    await page.waitForURL(origin + '/')
    assert.equal(new URL(page.url()).hash, '')
    await page.close()
  }
  // A failed download must reveal the existing decorative fallback.
  const page = await browser.newPage()
  await page.route('**/images/hero/hero-studio.jpg', route => route.abort())
  await page.route('**/images/about/studio-main.jpg', route => route.abort())
  await page.route('**/images/gifts/gift-certificates.jpg', route => route.abort())
  await page.goto(origin)
  for (const id of ['hero', 'about', 'gifts']) {
    const section = page.locator(id === 'hero' ? '.hero-section' : `#${id}`)
    await section.scrollIntoViewIfNeeded()
    await section.locator('img').waitFor({ state: 'detached' })
  }
  assert.ok(await page.locator('.hero-arch').isVisible())
  assert.ok(await page.locator('.about-art-text').isVisible())
  assert.ok(await page.locator('.gift-card-model').isVisible())
  await writeFile(new URL('browser-results.json', output), JSON.stringify({ passed: true, failedImageFallback: true, images: results }, null, 2))
  console.log(`Passed ${results.length} image/viewport checks and failed-image fallbacks.`)
} finally {
  if (browser) await browser.close()
  preview.kill()
}
