import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  envFile: false, appType: 'custom', logLevel: 'error', cacheDir: 'node_modules/.vite-seo-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(() => server.close())
const { getHeadTags, getPageMetadata, getSiteOrigin, indexablePaths } = await server.ssrLoadModule('/src/lib/seo.ts')

test('a clean build defaults to the actual production host without an environment override', () => {
  assert.equal(getSiteOrigin(), 'https://virgo.beautycz.workers.dev')
  for (const pathname of indexablePaths) {
    const page = getPageMetadata(pathname)
    assert.equal(page.canonical, `https://virgo.beautycz.workers.dev${pathname}`)
    assert.equal(new URL(page.image).origin, 'https://virgo.beautycz.workers.dev')
  }
})

test('only the five real pages are indexable with unique Czech metadata and path-specific canonicals', () => {
  assert.equal(indexablePaths.length, 5)
  const metadata = indexablePaths.map(pathname => getPageMetadata(pathname, 'https://approved.example'))
  assert.equal(new Set(metadata.map(page => page.title)).size, 5)
  assert.equal(new Set(metadata.map(page => page.description)).size, 5)
  metadata.forEach((page, index) => {
    assert.equal(page.noindex, false)
    assert.ok(page.title.includes('Litoměřice'))
    assert.equal(page.canonical, `https://approved.example${indexablePaths[index]}`)
    const tags = getHeadTags(page)
    assert.equal(tags.filter(tag => tag.attrs.name === 'description').length, 1)
    assert.equal(tags.find(tag => tag.attrs.property === 'og:url').attrs.content, page.canonical)
    assert.ok(tags.some(tag => tag.attrs.name === 'twitter:card'))
  })
})

test('an unselected domain never creates canonical URLs, absolute image URLs or a guessed business URL', () => {
  const page = getPageMetadata('/', null)
  assert.equal(page.canonical, null)
  assert.equal(page.image, null)
  assert.equal(page.business.url, undefined)
  assert.equal(page.business.logo, undefined)
  assert.equal(page.website, null)
  assert.ok(!getHeadTags(page).some(tag => tag.attrs.rel === 'canonical' || tag.attrs.property === 'og:url'))
})

test('canonical configuration accepts only HTTPS origins', () => {
  assert.equal(getSiteOrigin(''), null)
  assert.equal(getSiteOrigin(' https://approved.example/ '), 'https://approved.example')
  for (const value of ['not a URL', 'http://approved.example', 'https://approved.example/path', 'https://approved.example/?x=1', 'https://approved.example/#fragment', 'https://user:password@approved.example']) {
    assert.throws(() => getSiteOrigin(value), /VITE_SITE_URL/)
  }
})

test('unknown pages have no canonical or business schema and explicitly request noindex', () => {
  for (const pathname of ['/missing', '/sluzby/missing', '/sluzby/masaze/extra']) {
    const page = getPageMetadata(pathname, 'https://approved.example')
    assert.equal(page.noindex, true)
    assert.equal(page.canonical, null)
    assert.equal(page.business, null)
    assert.equal(page.website, null)
    assert.equal(getHeadTags(page).find(tag => tag.attrs.name === 'robots').attrs.content, 'noindex, follow')
  }
})

test('BeautySalon JSON-LD reuses supplied public data and never adds self-serving reviews', () => {
  const { business } = getPageMetadata('/', 'https://approved.example')
  assert.equal(business['@type'], 'BeautySalon')
  assert.equal(business.address.streetAddress, 'Masarykova 552/22')
  assert.equal(business.address.addressLocality, 'Litoměřice')
  assert.equal(business.address.addressCountry, 'CZ')
  assert.equal(business.telephone, '+420 608 391 605')
  assert.equal(business.openingHoursSpecification.length, 5)
  assert.equal(business.hasOfferCatalog.itemListElement.length, 4)
  assert.ok(!/aggregateRating|review|priceRange|legalName|taxID/i.test(JSON.stringify(business)))
  const encoded = getHeadTags(getPageMetadata('/', 'https://approved.example')).find(tag => tag.tag === 'script').text
  assert.deepEqual(JSON.parse(encoded), business)
})

test('the homepage has exactly one WebSite with the requested brand and production URL', () => {
  for (const pathname of indexablePaths) {
    const page = getPageMetadata(pathname)
    const schemas = getHeadTags(page).filter(tag => tag.tag === 'script').map(tag => JSON.parse(tag.text))
    const websites = schemas.filter(schema => schema['@type'] === 'WebSite')
    assert.equal(websites.length, pathname === '/' ? 1 : 0)
    assert.equal(getHeadTags(page).find(tag => tag.attrs.property === 'og:site_name').attrs.content, 'Beauty Studio Virgo')
    if (pathname === '/') {
      assert.deepEqual(websites[0], {
        '@context': 'https://schema.org', '@type': 'WebSite',
        '@id': 'https://virgo.beautycz.workers.dev/#website',
        name: 'Beauty Studio Virgo', alternateName: 'Virgo Beauty Studio',
        url: 'https://virgo.beautycz.workers.dev/',
      })
      assert.equal(schemas.filter(schema => schema['@type'] === 'BeautySalon').length, 1)
    } else assert.equal(page.website, null)
  }
})

test('WebSite URL follows the same explicit origin as the canonical URL', () => {
  const page = getPageMetadata('/', 'https://approved.example')
  assert.equal(page.website.url, page.canonical)
  assert.equal(page.website['@id'], 'https://approved.example/#website')
})
