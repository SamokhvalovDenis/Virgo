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
  await writeFile('reports/seo/production.json', JSON.stringify({ checkedAt: new Date().toISOString(), passed: true, pages: results, internalLinksWithoutJavaScript: true, xmlParsed: true, robotsAndSitemapHttp200: true, unknownRoutesHttp404: true, hydrationAndReloads: true }, null, 2) + '\n')
  console.log('PASS: five prerendered pages without JavaScript, real service links, unique metadata and canonical URLs, hydration/reloads, trailing-slash redirects, real 404, valid public/production XML and sitemap/robots HTTP 200.')
} finally {
  await browser.close()
  await preview.close()
}
