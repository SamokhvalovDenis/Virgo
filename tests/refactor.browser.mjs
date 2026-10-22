import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { startPreview } from './helpers/preview.mjs'

// Record once before a refactor; subsequent runs compare with that reviewed baseline.
const record = process.argv.includes('--record')
const output = 'reports/refactor'
const phase = record ? 'before' : 'after'
await mkdir(`${output}/${phase}`, { recursive: true })
const modules = await createServer({ envFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-refactor', server: { middlewareMode: true, hmr: false, watch: null } })
let data, details
try {
  data = await modules.ssrLoadModule('/src/data/index.ts')
  details = await modules.ssrLoadModule('/src/data/serviceDetails.ts')
  const serialized = JSON.stringify({ data, details }, (_, value) => typeof value === 'function' ? undefined : value, 2)
  if (record) await writeFile(`${output}/content-baseline.json`, serialized)
  else assert.deepEqual(JSON.parse(serialized), JSON.parse(await readFile(`${output}/content-baseline.json`, 'utf8')), 'All content, prices, reviews, contacts, assets and URLs are unchanged')
} finally { await modules.close() }

const server = await startPreview()
let browser
const results = []
async function compareScreenshots(page, expected, actual) {
  return page.evaluate(async ({ expected, actual }) => {
    const regions = [...document.images].map(image => {
      const rect = image.getBoundingClientRect()
      return { x: rect.x + scrollX, y: rect.y + scrollY, width: rect.width, height: rect.height }
    })
    async function pixels(base64, maskImages) {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0)
      if (maskImages) for (const rect of regions) {
        context.clearRect(Math.floor(rect.x) - 1, Math.floor(rect.y) - 1, Math.ceil(rect.width) + 2, Math.ceil(rect.height) + 2)
      }
      const hash = await crypto.subtle.digest('SHA-256', context.getImageData(0, 0, canvas.width, canvas.height).data)
      return { width: canvas.width, height: canvas.height, hash: [...new Uint8Array(hash)].join(',') }
    }
    const [before, after] = await Promise.all([pixels(expected, true), pixels(actual, true)])
    return JSON.stringify(before) === JSON.stringify(after)
  }, { expected: expected.toString('base64'), actual: actual.toString('base64') })
}
try {
  browser = await chromium.launch({ headless: true })
  for (const width of [320, 768, 1440]) {
    for (const route of ['/', ...details.serviceDetailPages.map(page => page.path), '/missing-page']) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
      page.on('request', request => assert.notEqual(request.method(), 'POST', 'No real submissions'))
      await page.goto(`${server.origin}${route}`, { waitUntil: 'networkidle' })
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(image => { image.loading = 'eager' })
        await Promise.all([...document.images].map(image => image.decode()))
        await document.fonts.ready
      })
      assert.equal(await page.locator('h1').count(), 1)
      const layout = await page.evaluate(() => ({
        text: document.body.innerText,
        title: document.title,
        metadata: [...document.querySelectorAll('head meta, head link[rel="canonical"]')].map(element => element.outerHTML),
        links: [...document.querySelectorAll('a')].map(anchor => [anchor.getAttribute('href'), anchor.getAttribute('target'), anchor.getAttribute('rel')]),
        images: [...document.images].map(image => [image.getAttribute('src'), image.alt, image.naturalWidth, image.naturalHeight]),
        overflow: document.documentElement.scrollWidth > innerWidth,
      }))
      assert.equal(layout.overflow, false, `${route} at ${width}: no horizontal overflow`)
      for (const anchor of await page.locator('a[href*="termino.eu"]').all()) {
        assert.equal(await anchor.getAttribute('href'), data.site.links.booking)
        assert.equal(await anchor.getAttribute('target'), '_blank')
      }
      const name = `${width}-${route === '/' ? 'home' : route.split('/').at(-1)}`
      const screenshot = await page.screenshot({ path: `${output}/${phase}/${name}.png`, fullPage: true, animations: 'disabled' })
      const sha256 = createHash('sha256').update(screenshot).digest('hex')
      const result = { name, route, width, layout, sha256 }
      let visualMatch = 'baseline'
      if (!record) {
        const baseline = JSON.parse(await readFile(`${output}/before/${name}.json`, 'utf8'))
        assert.deepEqual(layout, baseline.layout, `${name}: page content, links, metadata and images`)
        visualMatch = sha256 === baseline.sha256 ? 'exact' : 'image-paint-only'
        // Chromium may omit off-screen decoded images from a full-page capture.
        // Compare every other pixel; image paths, dimensions and original bytes are checked separately.
        if (visualMatch !== 'exact') assert.ok(await compareScreenshots(page, await readFile(`${output}/before/${name}.png`), screenshot), `${name}: pixels outside image bounds must match exactly`)
      }
      await writeFile(`${output}/${phase}/${name}.json`, JSON.stringify(result, null, 2))
      if (route === '/' && width < 1100) {
        const toggle = page.locator('.menu-toggle')
        await toggle.click()
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
        await page.keyboard.press('Escape')
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
      }
      if (route.startsWith('/sluzby/')) {
        await page.locator('.service-detail-back').first().click()
        await page.waitForURL(`${server.origin}/#services`)
        await page.locator('#services').waitFor()
      }
      assert.deepEqual(errors, [], `${name}: browser console`)
      results.push({ name, route, width, sha256, visualMatch })
      await page.close()
    }
  }
  await writeFile(`${output}/${phase}/results.json`, JSON.stringify({ passed: true, results }, null, 2))
  console.log(`${phase}: ${results.length} routes/viewports verified; ${results.filter(result => result.visualMatch === 'exact').length} exact screenshots; ${results.filter(result => result.visualMatch === 'image-paint-only').length} match outside image bounds`)
} finally {
  if (browser) await browser.close()
  await server.close()
}
