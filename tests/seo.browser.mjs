import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { chromium } from 'playwright'
import { startPreview } from './helpers/preview.mjs'

const paths = ['/', '/sluzby/masaze', '/sluzby/depilace', '/sluzby/trvale-odstraneni-chloupku', '/sluzby/oboci-a-rasy']
const preview = await startPreview()
const browser = await chromium.launch({ headless: true })
try {
  const titles = new Set()
  const descriptions = new Set()
  for (const path of paths) {
    const response = await fetch(`${preview.origin}${path}`)
    assert.equal(response.status, 200, path)
    const source = await response.text()
    assert.ok(source.includes('data-prerendered="true"'))
    assert.equal((source.match(/<h1[ >]/g) ?? []).length, 1)
    assert.ok(!source.includes('<!--app-html-->'))
    assert.ok(!source.includes('name="robots" content="noindex'))
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto(`${preview.origin}${path}`)
    assert.equal(await page.locator('main h1').count(), 1)
    assert.ok((await page.locator('main').innerText()).trim().length > 100)
    titles.add(await page.title())
    descriptions.add(await page.locator('meta[name="description"]').getAttribute('content'))
    await context.close()
    const hydrated = await browser.newPage()
    const errors = []
    hydrated.on('pageerror', error => errors.push(error.message))
    hydrated.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    await hydrated.goto(`${preview.origin}${path}`, { waitUntil: 'networkidle' })
    await hydrated.reload({ waitUntil: 'networkidle' })
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
  const html = await readFile('dist/index.html', 'utf8')
  const canonical = html.match(/rel="canonical" href="([^"]+)"/)
  if (canonical) {
    const sitemap = await readFile('dist/sitemap.xml', 'utf8')
    assert.equal((sitemap.match(/<url>/g) ?? []).length, 5)
    assert.ok(!sitemap.includes('lastmod'))
    assert.ok((await readFile('dist/robots.txt', 'utf8')).includes('Sitemap:'))
  } else {
    await assert.rejects(access('dist/sitemap.xml'))
    assert.ok(!(await readFile('dist/robots.txt', 'utf8')).includes('Sitemap:'))
  }
  console.log('PASS: five prerendered pages without JavaScript, unique metadata, hydration/reloads, trailing-slash redirects, real unknown-route 404 and conditional sitemap.')
} finally {
  await browser.close()
  await preview.close()
}
