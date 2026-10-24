import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({
  envFile: false,
  define: { 'import.meta.env.VITE_CONTACT_MODE': JSON.stringify('disabled') },
  appType: 'custom', logLevel: 'error',
  // The SSR test server must never invalidate a running dev server's optimizer cache.
  cacheDir: 'node_modules/.vite-tests',
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(() => server.close())
const data = await server.ssrLoadModule('/src/data/index.ts')
const { default: App } = await server.ssrLoadModule('/src/app/App.tsx')
const html = renderToStaticMarkup(createElement(App))
const { serviceDetailPages } = await server.ssrLoadModule('/src/data/serviceDetails.ts')

test('each category has exactly one detail route and all routes are unique', () => {
  assert.equal(new Set(serviceDetailPages.map(page => page.path)).size, serviceDetailPages.length)
  for (const category of data.categories) {
    assert.equal(serviceDetailPages.filter(page => page.categoryId === category.id).length, 1)
  }
})

test('unknown paths keep the shared layout and 404 content without home sections', () => {
  for (const pathname of ['/missing-page', '/sluzby/missing', '/sluzby/masaze/extra']) {
    const missing = renderToStaticMarkup(createElement(App, { pathname }))
    assert.ok(missing.includes('site-header'))
    assert.ok(missing.includes('site-footer'))
    assert.ok(missing.includes('href="/#services"'))
    assert.equal((missing.match(/<h1[ >]/g) ?? []).length, 1)
    assert.ok(!missing.includes('id="services"'))
    assert.ok(!missing.includes('class="mobile-booking"'))
  }
})

test('all 27 price pairs match the documented source, including the range', async () => {
  const source = await readFile(new URL('../docs/08-SOURCE-INVENTORY.md', import.meta.url), 'utf8')
  const rows = source.split('\n').filter(line => /^\|[^|]+\|\s*\d/.test(line))
  assert.equal(rows.length, 27)
  const value = text => text.includes('–') ? Object.fromEntries(['from', 'to'].map((key, i) => [key, Number(text.split('–')[i].trim())])) : Number(text.trim())
  rows.forEach((line, index) => {
    const columns = line.split('|')
    assert.deepEqual(data.depilationPrices[index].women, value(columns[2]))
    assert.deepEqual(data.depilationPrices[index].men, value(columns[3]))
  })
  assert.equal(new Set(data.depilationPrices.map(row => row.id)).size, 27)
  assert.equal(data.formatPrice({ from: 750, to: 850 }), '750–850 Kč')
  assert.equal(data.formatPrice(550), '550 Kč')
  assert.equal(data.formatPrice(null), null)
})

test('single h1, all mandatory sections including supplied reviews, and no unprovided FAQ', () => {
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1)
  for (const id of ['main', 'services', 'prices', 'about', 'gifts', 'benefits', 'contact']) assert.ok(html.includes(`id="${id}"`), id)
  assert.ok(html.includes('id="reviews"'))
  assert.ok(html.includes('href="/#reviews"'))
  assert.ok(html.indexOf('id="about"') < html.indexOf('id="reviews"'))
  assert.ok(html.indexOf('id="reviews"') < html.indexOf('id="gifts"'))
  assert.ok(!html.includes('id="faq"'))
  assert.equal((html.match(/<tbody[ >]/g) ?? []).length, 8)
  assert.equal((html.match(/scope="row"/g) ?? []).length, 39)
})

test('every booking action uses the one configured Termino URL', () => {
  const outsideReviews = html.replace(/<section id="reviews"[\s\S]*?<\/section>/, '')
  const anchors = [...outsideReviews.matchAll(/<a\b[^>]*class="[^"]*\bbutton\b[^"]*"[^>]*>/g)].map(match => match[0])
  const bookings = anchors.filter(anchor => anchor.includes('target="_blank"'))
  assert.ok(bookings.length >= 10)
  for (const anchor of bookings) {
    assert.ok(anchor.includes(`href="${data.site.links.booking}"`))
    assert.ok(anchor.includes('rel="noopener noreferrer"'))
  }
})

test('provided contacts and original local images render without invented ratings or legal pages', async () => {
  assert.ok(html.includes(data.site.location.fullAddress))
  assert.ok(html.includes(`href="${data.site.contact.phoneHref}"`))
  assert.ok(html.includes(`href="${data.site.contact.emailHref}"`))
  assert.ok(html.includes(`href="${data.site.links.facebook}"`))
  assert.ok(html.includes(`href="${data.site.links.instagram}"`))
  for (const name of ['Instagram', 'Facebook']) assert.ok(html.includes(`aria-label="${name}"`))
  assert.ok(!html.includes('<iframe'))
  const images = [...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)]
  assert.equal(images.length, 15)
  for (const [, src] of images) assert.ok([...Object.values(data.assets), ...data.aboutGallery.map(image => image.src), data.site.logo.src].includes(src), src)
  const logo = await readFile(new URL(`../public${data.site.logo.src}`, import.meta.url))
  assert.deepEqual(logo, await readFile(new URL('../public/images/virgo-original/virgo-fb1e81b9e08b.png', import.meta.url)))
  for (const [key, src] of Object.entries(data.assets).filter(([, src]) => src)) {
    const metadata = data.assetMetadata[key]
    assert.ok(metadata?.sourceFile, key)
    const selected = await readFile(new URL(`../public${src}`, import.meta.url))
    const originalPath = key === 'hero'
      ? data.aboutGallery.find(image => image.id === 'waiting-area').fullSrc
      : `/images/virgo-original/${metadata.sourceFile}`
    const original = await readFile(new URL(`../public${originalPath}`, import.meta.url))
    assert.deepEqual(selected, original, `${key} must preserve the supplied original`)
  }
  assert.ok(!html.includes('href="/privacy'))
  assert.ok(!html.includes('AggregateRating'))
})

test('all nine guestbook reviews retain exact supplied services, ratings and texts without personal data', async () => {
  const expected = JSON.parse(await readFile('tests/fixtures/guestbook-reviews.json', 'utf8'))
  assert.equal(expected.length, 9)
  assert.deepEqual(data.reviews.map(({ service, rating, text }) => ({ service, rating, text })), expected)
  assert.equal(new Set(data.reviews.map(review => review.id)).size, 9)
  const section = html.match(/<section id="reviews"[\s\S]*?<\/section>/)[0]
  assert.equal((section.match(/class="review-card"/g) ?? []).length, 9)
  for (const review of data.reviews) {
    assert.equal(review.source, 'guestbook')
    assert.ok(section.includes(review.text))
    assert.ok(section.includes(review.service))
    assert.deepEqual(Object.keys(review).sort(), ['id', 'rating', 'service', 'source', 'text'])
  }
  assert.equal((section.match(/aria-label="Hodnocení 4,5 z 5"/g) ?? []).length, 2)
  assert.equal((section.match(/aria-label="Hodnocení 5 z 5"/g) ?? []).length, 7)
  assert.equal((section.match(/Hodnocení z návštěvní knihy studia/g) ?? []).length, 9)
  assert.ok(section.includes('Vybraná hodnocení z návštěvní knihy našeho studia, zveřejněná se souhlasem jejich autorů.'))
  assert.ok(section.includes(data.content.reviews.provenanceDescription))
  assert.ok(!/<a\b|<time\b|<img\b|Anonymní zákazník|Google|Slevomat|AggregateRating/i.test(section))
})

test('review dates are optional and only supplied dates are rendered', async () => {
  const { ReviewCard } = await server.ssrLoadModule('/src/components/ui/ReviewCard.tsx')
  const undated = renderToStaticMarkup(createElement(ReviewCard, { review: data.reviews[0] }))
  assert.ok(!undated.includes('<time'))
  const dated = renderToStaticMarkup(createElement(ReviewCard, { review: { ...data.reviews[0], date: '2026-10-21' } }))
  assert.ok(dated.includes('<time dateTime="2026-10-21">21.10.2026</time>'))
})

test('an empty review collection hides the section', async () => {
  const { Reviews } = await server.ssrLoadModule('/src/components/sections/Reviews.tsx')
  const saved = data.reviews.splice(0)
  try { assert.equal(renderToStaticMarkup(createElement(Reviews)), '') }
  finally { data.reviews.push(...saved) }
})

test('form is explicitly disabled and its gift topic is available', () => {
  assert.equal(data.settings.contact.enabled, false)
  assert.ok(html.includes(data.content.form.disabled))
  assert.ok(/type="submit" disabled=""/.test(html))
  assert.ok(html.includes(`value="${data.giftCertificates.contactFormTopic}"`))
})

test('contact input validation rejects malformed and oversized submissions', async () => {
  const { contactSchema, contactSubmissionSchema } = await server.ssrLoadModule('/src/lib/contactSchema.ts')
  const valid = { name: 'Test klient', email: 'test@example.com', phone: '', serviceId: '', message: 'Dotaz ke službě.' }
  assert.ok(contactSchema.safeParse(valid).success)
  assert.ok(!contactSchema.safeParse({ ...valid, email: 'invalid' }).success)
  assert.ok(!contactSchema.safeParse({ ...valid, name: ' ' }).success)
  assert.ok(!contactSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).success)
  assert.ok(!contactSchema.safeParse({ ...valid, serviceId: 'made-up-service' }).success)
  assert.ok(!contactSubmissionSchema.safeParse({ ...valid, hcaptchaToken: '' }).success)
})

test('services and price groups have valid references and unique identifiers', () => {
  assert.equal(data.categories.length, 4)
  assert.equal(new Set(data.services.map(service => service.id)).size, data.services.length)
  for (const service of data.services) assert.ok(data.categories.some(category => category.id === service.categoryId))
  for (const price of data.depilationPrices) assert.ok(data.priceGroups.some(group => group.id === price.groupId))
})

test('editing service titles once updates detail headings and linked price rows', async () => {
  // Simulate edits in services.ts in memory, without changing the working tree.
  const renamedServer = await createServer({
    envFile: false, appType: 'custom', logLevel: 'error',
    cacheDir: 'node_modules/.vite-service-titles-tests',
    server: { middlewareMode: true, hmr: false, watch: null },
    plugins: [{
      name: 'rename-service-titles-for-test', enforce: 'pre',
      transform(code, id) {
        if (!id.replaceAll('\\', '/').endsWith('/src/data/services.ts')) return
        return code.replace(/(\btitle:\s*)"([^"]+)"/g,
          (_, prefix, title) => `${prefix}${JSON.stringify(`Test ${title}`)}`)
      },
    }],
  })
  try {
    const renamed = await renamedServer.ssrLoadModule('/src/data/index.ts')
    const { serviceDetailPages: pages } = await renamedServer.ssrLoadModule('/src/data/serviceDetails.ts')
    const { ServiceDetailPage } = await renamedServer.ssrLoadModule('/src/pages/ServiceDetailPage.tsx')
    const { getPriceGroups } = await renamedServer.ssrLoadModule('/src/lib/priceCatalog.ts')
    const { PriceTable } = await renamedServer.ssrLoadModule('/src/components/ui/PriceTable.tsx')
    let headings = 0
    for (const page of pages) {
      const markup = renderToStaticMarkup(createElement(ServiceDetailPage, { page }))
      for (const block of page.blocks) {
        const original = data.services.find(service => service.id === block.id)
        if (!original) continue // Informational sections are not service names.
        assert.equal(block.title, `Test ${original.title}`, block.id)
        assert.ok(markup.includes(`id="${block.id}-title">Test ${original.title}</h2>`), block.id)
        headings++
      }
    }
    assert.equal(headings, 16)
    let linkedPrices = 0
    for (const row of data.massagePrices) {
      const service = data.services.find(service => row.label.startsWith(service.title))
      if (!service) continue
      assert.equal(renamed.massagePrices.find(item => item.id === row.id).label, `Test ${row.label}`, row.id)
      linkedPrices++
    }
    assert.equal(linkedPrices, 15)
    const massageCatalog = renamed.priceCatalogs.find(catalog => catalog.id === 'massage')
    assert.equal(massageCatalog.groups.find(group => group.id === 'madero').title, 'Test Maderoterapie')
    assert.equal(renamed.browsLashesPrices.find(row => row.id === 'brow-price-both-lamination').label,
      'Test Laminace obočí + řas')
    const tables = getPriceGroups(massageCatalog, 'women')
      .map(group => renderToStaticMarkup(createElement(PriceTable, { group, categoryId: 'massage' }))).join('')
    assert.ok(tables.includes('Test Čokoládová masáž'))
    assert.ok(tables.includes('Test Masáž proti celulitidě'))
    assert.throws(() => renamed.getServiceTitle('missing-service'), /Unknown service/)
  } finally {
    await renamedServer.close()
  }
})

test('all home anchors resolve and every service category links to its detail page', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]))
  const targets = [...html.matchAll(/\bhref="\/?#([^"]+)"/g)].map(match => match[1])
  for (const target of targets) assert.ok(ids.has(target), `Missing anchor: ${target}`)
  assert.equal((html.match(/class="service-card"/g) ?? []).length, 4)
  for (const page of serviceDetailPages) assert.ok(html.includes(`href="${page.path}"`))
  assert.equal((html.match(/class="service-learn-more"/g) ?? []).length, 4)
  assert.ok(!html.includes('<details class="service-details"'))
  assert.ok(html.includes('aria-controls="mobile-menu"'))
  assert.ok(html.includes('aria-expanded="false"'))
  assert.ok(/id="mobile-menu"[^>]*hidden=""/.test(html))
})

test('all 18 source blocks retain category order, exact adjacent photos and complete lists', async () => {
  const source = JSON.parse(await readFile(new URL('../reports/virgo-service-source.json', import.meta.url), 'utf8'))
  assert.deepEqual(serviceDetailPages.map(page => page.blocks.length), [10, 3, 2, 3])
  const blocks = serviceDetailPages.flatMap(page => page.blocks)
  assert.equal(blocks.length, source.blocks.length)
  assert.equal(new Set(blocks.map(block => block.id)).size, 18)
  for (const [index, block] of blocks.entries()) {
    const original = source.blocks[index]
    assert.equal(block.sourceTitle, original.title, `Source order: ${block.id}`)
    assert.equal(block.image.src, original.exactFile, `Adjacent source photo: ${block.id}`)
    const bytes = await readFile(new URL(`../public${block.image.src}`, import.meta.url))
    assert.ok(bytes.length > 1000)
    assert.ok(block.image.src.startsWith('/images/virgo-original/'))
    assert.equal(block.content.filter(part => part.type === 'list').flatMap(part => part.items).length, original.listItems.length, `All source list items: ${block.id}`)
    const transferred = block.content.flatMap(part => part.type === 'paragraph' ? [part.text] : part.items.map(item => item.text)).join(' ')
    const wordCount = value => value.split(/\s+/).filter(Boolean).length
    assert.ok(wordCount(transferred) >= wordCount(original.paragraphs.map(part => part.text).join(' ')) * 0.8, `Description must not be shortened: ${block.id}`)
  }
})

test('every detail URL renders only its full category with alternating photos and no prices or procedure bookings', () => {
  for (const page of serviceDetailPages) {
    const detail = renderToStaticMarkup(createElement(App, { pathname: page.path }))
    const main = detail.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1]
    assert.equal((detail.match(/<h1[ >]/g) ?? []).length, 1)
    assert.ok(main.includes(`<h1>${page.title}</h1>`))
    assert.equal((main.match(/class="service-detail-block(?: service-detail-block-reversed)?"/g) ?? []).length, page.blocks.length)
    assert.equal((main.match(/service-detail-block-reversed/g) ?? []).length, Math.floor(page.blocks.length / 2))
    assert.equal((main.match(/<img /g) ?? []).length, page.blocks.length)
    assert.ok(!/<table|<details|Kč|price-|Rezervovat|termino\.eu/.test(main))
    assert.ok(!/Tvrzení k ověření|schválení majitelkou|Takto označená tvrzení|Původní popis uvádí|service-claim-label|service-detail-review-note/.test(main))
    let previous = -1
    for (const block of page.blocks) {
      const position = main.indexOf(`id="${block.id}"`)
      assert.ok(position > previous)
      previous = position
      const photoPosition = main.indexOf(`src="${block.image.src}"`)
      const textPosition = main.indexOf(`id="${block.id}-title"`)
      assert.ok(photoPosition > position && photoPosition < textPosition, 'DOM order keeps the image above text on mobile')
      for (const part of block.content) {
        for (const item of part.type === 'paragraph' ? [part] : part.items) {
          assert.ok(main.includes(item.text))
        }
      }
    }
    for (const other of serviceDetailPages.filter(other => other !== page)) {
      for (const block of other.blocks) assert.ok(!main.includes(`id="${block.id}"`))
    }
    assert.ok(detail.includes('href="/#services"'))
    assert.ok(detail.includes('href="/#prices"'))
    assert.equal(renderToStaticMarkup(createElement(App, { pathname: `${page.path}/` })), detail)
  }
})

test('missing contact and location fields still produce a safe fallback', () => {
  const contact = { ...data.site.contact }
  const location = { ...data.site.location }
  try {
    Object.assign(data.site.contact, { phone: null, phoneHref: null, email: null, emailHref: null })
    Object.assign(data.site.location, { street: null, postalCode: null, fullAddress: null })
    const withoutContacts = renderToStaticMarkup(createElement(App))
    assert.ok(withoutContacts.includes(`${data.site.location.city}, ${data.site.location.country}`))
    assert.ok(!withoutContacts.includes('href="tel:'))
    assert.ok(!withoutContacts.includes('href="mailto:'))
    assert.ok(!withoutContacts.includes('maps/search'))
  } finally {
    Object.assign(data.site.contact, contact)
    Object.assign(data.site.location, location)
  }
})

test('all supplied opening hours and the special-hours note are displayed', () => {
  assert.equal(data.site.openingHours.length, 7)
  for (const { day, hours } of data.site.openingHours) {
    assert.ok(html.includes(`<dt>${day}</dt><dd>${hours}</dd>`))
  }
  assert.ok(html.includes(data.site.hoursNote))
  const mapUrl = new URL(data.getGoogleMapsUrl())
  assert.equal(mapUrl.searchParams.get('query'), data.site.location.fullAddress)
})

test('address, phone and email appear both in the contact section and the footer', () => {
  const contact = html.slice(html.indexOf('<section id="contact"'), html.indexOf('<footer'))
  const footer = html.slice(html.indexOf('<footer'))
  for (const section of [contact, footer]) {
    for (const value of [data.site.location.fullAddress, data.site.contact.phone, data.site.contact.email]) assert.ok(section.includes(value))
  }
})

test('disabled contact client returns unavailability without sending a network request', async () => {
  const { submitContact } = await server.ssrLoadModule('/src/lib/contact.ts')
  const originalFetch = globalThis.fetch
  let requests = 0
  globalThis.fetch = async () => { requests += 1; throw new Error('Unexpected network request') }
  try {
    const result = await submitContact({ name: 'Test klient', email: 'test@example.com', phone: '', serviceId: '', message: 'Test message' })
    assert.equal(result.success, false)
    assert.equal(result.code, 'CONTACT_DISABLED')
    assert.equal(requests, 0)
  } finally { globalThis.fetch = originalFetch }
})

test('all new prices match the reviewed image transcription and have valid provenance', async () => {
  const source = JSON.parse(await readFile(new URL('../reports/price-audit/transcribed-prices.json', import.meta.url), 'utf8'))
  const revisedPriceIds = {
    massagePrices: new Set([
      'massage-price-whole-30', 'massage-price-whole-60', 'massage-price-whole-90', 'massage-price-whole-120',
      'massage-price-back', 'massage-price-face', 'massage-price-neck', 'massage-price-back-neck',
      'massage-price-lower-40', 'massage-price-lower-60', 'massage-price-upper', 'massage-price-feet',
      'massage-price-back-cupping', 'massage-price-cupping', 'massage-price-honey', 'massage-price-chocolate',
      'massage-price-hot-stones', 'massage-price-anticellulite-60', 'massage-price-anticellulite-90',
      'massage-price-ozone', 'massage-price-ozone-5', 'massage-price-ozone-10',
      'massage-price-madero-60', 'massage-price-madero-90', 'massage-price-madero-3-60',
      'massage-price-madero-5-60', 'massage-price-madero-3-90', 'massage-price-madero-5-90',
      'massage-price-cinnamon-mud', 'massage-price-peat', 'massage-price-indian-head',
      'massage-price-thai-feet', 'massage-price-ayurveda', 'massage-price-lymphatic',
      'massage-price-lymphatic-90',
    ]),
    browsLashesPrices: new Set([
      'brow-price-correction-women', 'brow-price-correction-men', 'brow-price-color',
      'brow-price-color-correction', 'brow-price-lamination-correction',
      'brow-price-lamination-color-correction', 'brow-price-lightening', 'brow-price-lashes-color',
      'brow-price-lashes-lamination', 'brow-price-lashes-lamination-color',
      'brow-price-both-lamination', 'brow-price-both-complex',
    ]),
  }
  for (const key of ['additionalDepilationPrices', 'massagePrices', 'browsLashesPrices', 'deviceHairRemovalPrices', 'deviceHairRemovalPackages']) {
    // Display names and optional notes are editable independently of the transcription.
    // Keep checking every amount, duration, identifier and source reference.
    const revisedIds = revisedPriceIds[key] ?? new Set()
    const rows = data[key].filter(row => !revisedIds.has(row.id))
    const sourceRows = source[key].filter(row => !revisedIds.has(row.id))
    const withoutEditorialFields = rows => rows.map(({ label, ...row }) => {
      assert.ok(typeof label === 'string' && label.trim().length > 0)
      for (const field of ['note', 'womenNote', 'menNote']) delete row[field]
      return row
    })
    assert.deepEqual(JSON.parse(JSON.stringify(withoutEditorialFields(rows))), withoutEditorialFields(sourceRows), key)
  }
  const inventory = JSON.parse(await readFile(new URL('../reports/virgo-images.json', import.meta.url), 'utf8'))
  for (const source of Object.values(data.priceSources)) assert.ok(inventory.images.some(image => image.file === source.file && image.status === 'downloaded'))
  const ids = []
  for (const catalog of data.priceCatalogs) {
    for (const group of catalog.groups) {
      for (const row of group.rows) {
        ids.push(row.id)
        for (const sourceId of row.sourceIds) assert.ok(data.priceSources[sourceId], sourceId)
      }
    }
  }
  assert.equal(ids.length, 128)
  assert.equal(new Set(ids).size, ids.length)
  assert.equal(Object.keys(data.priceSources).length, 10)
})

test('every category and audience exposes only its own readable prices and notes', async () => {
  const { getPriceGroups } = await server.ssrLoadModule('/src/lib/priceCatalog.ts')
  const { PriceTable } = await server.ssrLoadModule('/src/components/ui/PriceTable.tsx')
  const counts = { depilation: [39, 41], massage: [30, 30], 'hair-removal': [35, 34], 'brows-lashes': [10, 10] }
  for (const catalog of data.priceCatalogs) {
    for (const [index, audience] of ['women', 'men'].entries()) {
      const groups = getPriceGroups(catalog, audience)
      const rows = groups.flatMap(group => group.rows)
      assert.equal(rows.length, counts[catalog.id][index], `${catalog.id}/${audience}`)
      assert.ok(rows.every(row => row.price !== null && row.price !== 0))
      for (const group of groups) {
        const table = renderToStaticMarkup(createElement(PriceTable, { group, categoryId: catalog.id }))
        assert.equal((table.match(/price-row-booking/g) ?? []).length, group.rows.length)
        assert.ok(!table.includes('<img'))
      }
      if (catalog.id === 'depilation') {
        const wholeBody = rows.find(row => row.id === 'depilation-extra-whole-body')
        assert.equal(Boolean(wholeBody), audience === 'men')
        if (wholeBody) assert.equal(wholeBody.note, 'Kauce 2 000 Kč.')
      }
    }
  }
})

test('massage prices match all procedures and rates in the supplied price list', () => {
  assert.deepEqual(data.massagePrices.map(({ id, price, detail }) => [id, price, detail]), [
    ['massage-price-whole-30', 500, '30 min'],
    ['massage-price-whole-60', 1000, '60 min'],
    ['massage-price-whole-90', 1500, '90 min'],
    ['massage-price-whole-120', 1900, '120 min'],
    ['massage-price-face', 500, '30 min'],
    ['massage-price-neck', 350, '20 min'],
    ['massage-price-feet', 350, '20 min'],
    ['massage-price-cupping', 550, '30 min'],
    ['massage-price-honey', 600, '30 min'],
    ['massage-price-chocolate', 1100, '60 min'],
    ['massage-price-hot-stones', 1100, '60 min'],
    ['massage-price-anticellulite-60', 1100, '60 min'],
    ['massage-price-anticellulite-90', 1600, '90 min'],
    ['massage-price-madero-60', 1100, '60 min'],
    ['massage-price-madero-90', 1600, '90 min'],
    ['massage-price-madero-3-60', 3000, '3 × 60 min'],
    ['massage-price-madero-5-60', 4900, '5 × 60 min'],
    ['massage-price-madero-3-90', 4500, '3 × 90 min'],
    ['massage-price-madero-5-90', 7200, '5 × 90 min'],
    ['massage-price-cinnamon-mud', 500, '1 × 20–30 min'],
    ['massage-price-cinnamon-mud-3', 1300, '3 ošetření'],
    ['massage-price-cinnamon-mud-5', 2300, '5 ošetření'],
    ['massage-price-cinnamon-mud-10', 4600, '10 ošetření'],
    ['massage-price-paraffin-hands', 290, undefined],
    ['massage-price-paraffin-feet', 320, undefined],
    ['massage-price-indian-head', 1000, '60 min'],
    ['massage-price-thai-feet', 1000, '60 min'],
    ['massage-price-ayurveda', 2200, '120 min'],
    ['massage-price-lymphatic', 1100, '60 min'],
    ['massage-price-lymphatic-90', 1600, '90 min'],
  ])
  const selectedParts = data.massagePrices.filter(row => row.label === 'Regenerační a relaxační masáž')
  assert.ok(selectedParts.every(row => row.note === 'Při masáži si můžete zvolit, na které partie se zaměříme: záda, šíji, horní nebo dolní končetiny.'))
  assert.equal(data.massagePrices.find(row => row.id === 'massage-price-lymphatic').label, 'Manuální lymfodrenáž')
  assert.equal(data.massagePrices.find(row => row.id === 'massage-price-cinnamon-mud').label, 'Skořicový / ozonový zábal')
})

test('cosmetic prices match all services and rates in the supplied price list', () => {
  assert.deepEqual(data.browsLashesPrices.map(({ id, label, price }) => [id, label, price]), [
    ['brow-price-correction-women', 'Úprava obočí', 250],
    ['brow-price-color', 'Barvení obočí', 300],
    ['brow-price-color-correction', 'Barvení + úprava obočí', 500],
    ['brow-price-lamination-correction', 'Laminace + úprava obočí', 1000],
    ['brow-price-lamination-color-correction', 'Laminace + barvení + úprava obočí', 1200],
    ['brow-price-lashes-color', 'Barvení řas', 300],
    ['brow-price-lashes-lamination', 'Laminace řas', 950],
    ['brow-price-lashes-lamination-color', 'Laminace + barvení řas', 1100],
    ['brow-price-both-lamination', 'Laminace obočí + řas', 1800],
    ['brow-price-both-complex', 'Komplex obočí + řasy', 2100],
  ])
})
