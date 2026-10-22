import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'
import { createStaticPreview } from '../../scripts/preview.mjs'

const output = 'reports/gift-cards'
const server = await createStaticPreview()
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const width of [1440, 1280, 1024, 768, 767, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1100 }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(server.origin, { waitUntil: 'networkidle' })
    await page.locator('#gifts').scrollIntoViewIfNeeded()
    await page.locator('.gift-photo').evaluate(image => image.decode())
    await page.evaluate(() => document.fonts.ready)
    assert.equal(await page.locator('#benefits').count(), 1)
    assert.equal(await page.locator('#gifts #benefits').count(), 1)
    assert.deepEqual(await page.locator('#benefits li').allTextContents(), ['Flexi karta', 'Flexi poukázky', 'Dárek', 'Fokus'])
    assert.equal(await page.locator('#benefits h3').textContent(), 'Přijímáme Pluxee benefity')
    assert.equal(await page.locator('.gift-photo').getAttribute('src'), '/images/gifts/gift-certificates.jpg')
    const layout = await page.evaluate(() => {
      const rect = selector => {
        const { x, y, width, height, bottom, right } = document.querySelector(selector).getBoundingClientRect()
        return { x, y, width, height, bottom, right }
      }
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll('#gifts .gift-copy, .gift-cta, .gift-photo, .benefits-intro, .benefit-products li')].some(element => {
          const rect = element.getBoundingClientRect()
          return rect.x < 0 || rect.right > innerWidth
        }),
        copy: rect('.gift-copy'), button: rect('.gift-cta'), photo: rect('.gift-photo'), benefits: rect('#benefits'),
      }
    })
    assert.equal(layout.overflow, false, `${width}: no page overflow`)
    assert.equal(layout.clipped, false, `${width}: all gift content fits`)
    assert.ok(layout.button.height <= 64, `${width}: CTA text fits on one line`)
    assert.ok(layout.benefits.y >= layout.photo.bottom, `${width}: benefits follow the photo`)
    if (width <= 767) assert.ok(layout.photo.y >= layout.button.bottom, `${width}: mobile content order`)
    else assert.ok(layout.photo.x >= layout.copy.right, `${width}: two columns`)
    assert.deepEqual(errors, [])
    await page.locator('#gifts').screenshot({ path: `${output}/${width}.png`, style: '.site-header, .mobile-booking { visibility: hidden; }' })
    await page.locator('.gift-cta').click()
    await page.waitForFunction(() => location.hash === '#contact')
    const topic = await page.locator('#contact select').inputValue()
    assert.equal(topic, 'gift-certificate', `${width}: gift topic selected`)
    results.push({ width, passed: true, ...layout, topic })
    console.log(`PASS: ${width}px, layout, no overflow, integrated benefits, original photo and CTA topic`)
    await page.close()
  }
  await writeFile(`${output}/results.json`, JSON.stringify({ passed: true, results }, null, 2))
} finally { await browser.close(); await server.close() }
