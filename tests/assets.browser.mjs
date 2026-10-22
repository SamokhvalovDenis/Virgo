import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const fontReport = JSON.parse(await readFile('reports/prelaunch/fonts.json', 'utf8'))
const fonts = await Promise.all(fontReport.results.map(async font => ({
  subset: font.subset,
  original: (await readFile(font.source)).toString('base64'),
  optimized: (await readFile(`public${font.file}`)).toString('base64'),
})))
const server = await startPreview()
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.goto(server.origin, { waitUntil: 'networkidle' })
  const metrics = await page.evaluate(async fonts => {
    for (const font of fonts) for (const kind of ['original', 'optimized']) {
      const face = new FontFace(`InterAudit-${kind}`, `url(data:font/woff2;base64,${font[kind]})`, {
        weight: '100 900',
        unicodeRange: font.subset === 'latin' ? 'U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2212' : 'U+0100-017F,U+0300-036F',
      })
      await face.load(); document.fonts.add(face)
    }
    const text = 'Příliš žluťoučký kůň úpěl ďábelské ódy. ĚŠČŘŽÝÁÍÉŮÚ — 650 Kč, 4,5/5'
    const results = []
    for (const weight of [400, 500, 600, 650, 700]) {
      const canvases = ['original', 'optimized'].map(kind => {
        const canvas = document.createElement('canvas'); canvas.width = 2000; canvas.height = 60
        const context = canvas.getContext('2d'); context.font = `${weight} 18px InterAudit-${kind}`
        context.fillText(text, 10, 40)
        return { width: context.measureText(text).width, pixels: context.getImageData(0, 0, 2000, 60).data }
      })
      results.push({ weight, originalWidth: canvases[0].width, optimizedWidth: canvases[1].width, identicalPixels: canvases[0].pixels.every((value, index) => value === canvases[1].pixels[index]) })
    }
    return results
  }, fonts)
  for (const result of metrics) {
    assert.equal(result.optimizedWidth, result.originalWidth, `Preserve Czech text metrics at weight ${result.weight}`)
    assert.equal(result.identicalPixels, true, `Preserve Czech glyph appearance at weight ${result.weight}`)
  }
  const assets = []
  for (const width of [320, 1440]) for (const route of ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto(server.origin + route, { waitUntil: 'networkidle' })
    const images = await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(image => { image.loading = 'eager' })
      await Promise.all([...document.images].map(image => image.decode()))
      return [...document.images].map(image => ({ src: image.getAttribute('src'), selected: image.currentSrc, width: image.naturalWidth, alt: image.alt, responsive: Boolean(image.srcset) }))
    })
    assert.ok(images.every(image => image.width > 0 && image.alt))
    assert.ok(images.some(image => image.responsive && image.selected.includes('/images/optimized/')))
    assets.push({ width, route, images })
  }
  await page.close()
  const failure = await browser.newPage()
  await failure.route('**/assets/ContactForm-*.js', route => route.abort())
  await failure.goto(server.origin, { waitUntil: 'networkidle' })
  await failure.locator('#contact [role="alert"]').waitFor()
  assert.equal(await failure.locator('main h1').count(), 1, 'A failed form chunk preserves the page')
  assert.ok(await failure.locator('.hero-actions a[href*="termino.eu"]').isVisible())
  await failure.close()
  await mkdir('reports/prelaunch/assets', { recursive: true })
  await writeFile('reports/prelaunch/assets/browser-results.json', JSON.stringify({ passed: true, metrics, assets, failedFormChunkPreservesPage: true }, null, 2))
  console.log('PASS: identical Czech font metrics/pixels at five weights, all selected images decode at 10 route/viewports, form chunk failure preserves the page.')
} finally { await browser.close(); await server.close() }
