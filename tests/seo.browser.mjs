import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const paths = ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']
const origin = 'https://virgo.beautycz.workers.dev'
const expectedH1 = ['Dopřejte si chvíli péče a odpočinku', 'Masáže', 'Depilace', 'Trvalé odstranění chloupků', 'Péče o obočí a řasy']
const results = []
const preview = await startPreview()
const browser = await chromium.launch({ headless: true })
try {
  const titles = new Set()
  const descriptions = new Set()
  for (const path of paths) {
    const response = await fetch(`${preview.origin}${path}`, { redirect: 'manual', headers: { 'User-Agent': 'Googlebot' } })
    assert.equal(response.status, 200, path)
    assert.equal(response.headers.get('location'), null)
    assert.ok(!/noindex|none/i.test(response.headers.get('x-robots-tag') ?? ''))
    const source = await response.text()
    assert.ok(source.includes('data-prerendered="true"'))
    assert.equal((source.match(/<h1[ >]/g) ?? []).length, 1)
    assert.ok(!source.includes('<!--app-html-->'))
    assert.ok(!source.includes('name="robots" content="noindex'))
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${preview.origin}${path}`)
    assert.equal(await page.locator('html').getAttribute('lang'), 'cs')
    assert.equal(await page.locator('main h1').count(), 1)
    assert.equal((await page.locator('main h1').innerText()).replace(/\s+/g, ' ').trim(), expectedH1[paths.indexOf(path)])
    assert.ok((await page.locator('main').innerText()).trim().length > 100)
    assert.equal(await page.locator('head title').count(), 1)
    assert.equal(await page.locator('meta[name="description"]').count(), 1)
    assert.equal(await page.locator('link[rel="canonical"]').count(), 1)
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), origin + path)
    assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'), origin + path)
    assert.equal(await page.locator('meta[property="og:site_name"]').count(), 1)
    assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute('content'), 'Beauty Studio Virgo')
    assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), await page.title())
    assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), await page.locator('meta[name="description"]').getAttribute('content'))
    assert.equal(await page.locator('link[rel="icon"][href="/favicon.png"][sizes="96x96"]').count(), 1)
    assert.equal(await page.locator('link[rel="icon"][href="/favicon.ico"]').count(), 1)
    assert.equal(await page.locator('link[href="/favicon.svg"]').count(), 0)
    const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll(tags => {
      const collect = value => {
        if (Array.isArray(value)) return value.flatMap(collect)
        if (!value || typeof value !== 'object') return []
        return [value, ...Object.values(value).flatMap(collect)]
      }
      return tags.flatMap(tag => collect(JSON.parse(tag.textContent)))
    })
    const websites = schemas.filter(schema => [schema['@type']].flat().includes('WebSite'))
    assert.equal(websites.length, path === '/' ? 1 : 0, `${path}: no duplicate or conflicting WebSite nodes in production HTML`)
    if (path === '/') {
      assert.deepEqual(websites[0], {
        '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${origin}/#website`,
        name: 'Beauty Studio Virgo', alternateName: 'Virgo Beauty Studio', url: `${origin}/`,
      })
      assert.equal(schemas.filter(schema => schema['@type'] === 'BeautySalon').length, 1)
    }
    assert.ok(!/noindex|none/i.test((await page.locator('meta[name="robots"]').evaluateAll(tags => tags.map(tag => tag.content))).join('')))
    if (path === '/') {
      for (const service of paths.slice(1)) {
        const link = page.locator(`main a[href="${service}"]`)
        assert.equal(await link.count(), 1)
        assert.ok(!/nofollow/i.test(await link.getAttribute('rel') ?? ''))
        await link.click()
        assert.equal(new URL(page.url()).pathname, service, 'A real service link navigates without JavaScript')
        await page.locator('.service-detail-back').first().click()
        assert.equal(new URL(page.url()).pathname, '/')
      }
    } else {
      assert.ok(await page.locator('main .service-detail-block h2').count() > 0)
      assert.ok(await page.locator('main .service-detail-copy p, main .service-detail-copy li').count() > 0)
    }
    titles.add(await page.title())
    descriptions.add(await page.locator('meta[name="description"]').getAttribute('content'))
    const noJsReload = await page.reload()
    assert.equal(noJsReload.status(), 200)
    results.push({ path, status: response.status, title: await page.title(), description: await page.locator('meta[name="description"]').getAttribute('content'), canonical: origin + path, h1: expectedH1[paths.indexOf(path)], withoutJavaScript: true })
    await context.close()
    const hydrated = await browser.newPage()
    const errors = []
    hydrated.on('pageerror', error => errors.push(error.message))
    hydrated.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await hydrated.goto(`${preview.origin}${path}`, { waitUntil: 'networkidle' })
    const reload = await hydrated.reload({ waitUntil: 'networkidle' })
    assert.equal(reload.status(), 200)
    assert.equal(await hydrated.locator('link[rel="canonical"]').getAttribute('href'), origin + path)
    assert.equal(await hydrated.locator('script[type="application/ld+json"]').count(), path === '/' ? 2 : 0, 'Hydration must preserve the prerendered schemas without adding duplicates')
    assert.deepEqual(errors, [], `${path}: hydration/console errors`)
    await hydrated.close()
    if (path !== '/') {
      const redirect = await fetch(`${preview.origin}${path}/`, { redirect: 'manual' })
      assert.equal(redirect.status, 301)
      assert.equal(redirect.headers.get('location'), path)
    }
  }
  assert.equal(titles.size, 5)
  assert.equal(descriptions.size, 5)
  for (const path of ['/missing', '/sluzby/missing', '/sluzby/masaze/extra']) {
    const response = await fetch(`${preview.origin}${path}`)
    assert.equal(response.status, 404, path)
    const source = await response.text()
    assert.ok(source.includes('noindex, follow'))
    assert.ok(source.includes('Stránka nebyla nalezena'))
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${preview.origin}${path}`, { waitUntil: 'networkidle' })
    assert.equal(await page.locator('main h1').textContent(), 'Stránka nebyla nalezena')
    assert.deepEqual(errors, [])
    await page.close()
  }
  const parser = await browser.newPage()
  const faviconResults = []
  for (const [path, size] of [['/favicon.png', 96], ['/apple-touch-icon.png', 180], ['/favicon.ico', null]]) {
    const response = await fetch(preview.origin + path, { redirect: 'manual', headers: { 'User-Agent': 'Googlebot-Image' } })
    assert.equal(response.status, 200, `${path}: direct URL`)
    assert.equal(response.headers.get('location'), null)
    assert.ok(!/noindex|none/i.test(response.headers.get('x-robots-tag') ?? ''))
    assert.match(response.headers.get('content-type'), size ? /^image\/png/ : /^image\/(?:x-icon|vnd\.microsoft\.icon)/)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.deepEqual(bytes, await readFile(`public${path}`), `${path}: build must preserve favicon bytes`)
    if (size) {
      assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
      assert.equal(bytes.readUInt32BE(16), size)
      assert.equal(bytes.readUInt32BE(20), size)
    } else {
      assert.equal(bytes.readUInt16LE(0), 0)
      assert.equal(bytes.readUInt16LE(2), 1)
      const entries = Array.from({ length: bytes.readUInt16LE(4) }, (_, index) => {
        const entry = 6 + index * 16
        const width = bytes[entry] || 256
        assert.equal(bytes[entry + 1] || 256, width)
        const offset = bytes.readUInt32LE(entry + 12)
        const length = bytes.readUInt32LE(entry + 8)
        assert.ok(offset + length <= bytes.length)
        const png = bytes.subarray(offset, offset + length)
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
        assert.equal(png.readUInt32BE(16), width)
        assert.equal(png.readUInt32BE(20), width)
        return width
      })
      assert.deepEqual(entries, [16, 32, 48, 96, 192])
    }
    const decoded = await parser.evaluate(async url => {
      const image = new Image()
      image.src = url
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    }, preview.origin + path)
    assert.equal(decoded.width, decoded.height)
    if (size) assert.equal(decoded.width, size)
    faviconResults.push({ path, status: response.status, contentType: response.headers.get('content-type'), ...decoded })
  }
  for (const directory of ['public', 'dist']) {
    const sitemap = await readFile(`${directory}/sitemap.xml`, 'utf8')
    const parsed = await parser.evaluate(source => {
      const xml = new DOMParser().parseFromString(source, 'application/xml')
      return { error: xml.querySelector('parsererror')?.textContent ?? null, namespace: xml.documentElement.namespaceURI, urls: [...xml.querySelectorAll('url > loc')].map(loc => loc.textContent) }
    }, sitemap)
    assert.equal(parsed.error, null, `${directory}/sitemap.xml must be well-formed XML`)
    assert.equal(parsed.namespace, 'http://www.sitemaps.org/schemas/sitemap/0.9')
    assert.deepEqual(parsed.urls, paths.map(path => origin + path))
    const robots = await readFile(`${directory}/robots.txt`, 'utf8')
    assert.match(robots, /^User-agent: \*$/m)
    assert.match(robots, /^Allow: \/$/m)
    assert.ok(!/^Disallow:\s*\//mi.test(robots))
    assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
  }
  await parser.close()
  for (const path of ['/sitemap.xml', '/robots.txt']) {
    const response = await fetch(preview.origin + path, { redirect: 'manual' })
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), path.endsWith('.xml') ? /xml/ : /text\/plain/)
  }
  await mkdir('reports/seo', { recursive: true })
  await writeFile('reports/seo/production.json', JSON.stringify({ checkedAt: new Date().toISOString(), passed: true, pages: results, favicons: faviconResults, singleHomepageWebSite: true, consistentOpenGraph: true, internalLinksWithoutJavaScript: true, xmlParsed: true, robotsAndSitemapHttp200: true, unknownRoutesHttp404: true, hydrationAndReloads: true }, null, 2) + '\n')
  console.log('PASS: five prerendered pages without JavaScript, one homepage WebSite, consistent Open Graph, favicon PNG/ICO HTTP 200 and image decoding, real service links, unique metadata/canonicals, hydration, redirects, 404 and valid sitemap/robots.')
} finally {
  await browser.close()
  await preview.close()
}
