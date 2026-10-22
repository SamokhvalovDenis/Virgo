import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const output = 'reports/hero-photo-audit'
await mkdir(output, { recursive: true })
const entries = (await readdir('public/images/virgo-original')).filter(file => /\.(jpe?g|png|webp)$/i.test(file)).sort()
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } })
  for (let start = 0; start < entries.length; start += 40) {
    const cards = await Promise.all(entries.slice(start, start + 40).map(async (file, offset) => {
      const data = await readFile(`public/images/virgo-original/${file}`)
      const mime = file.endsWith('.png') ? 'image/png' : file.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
      return `<figure><img src="data:${mime};base64,${data.toString('base64')}"><figcaption>${start + offset + 1}: ${file}</figcaption></figure>`
    }))
    await page.setContent(`<style>body{margin:0;display:grid;grid-template-columns:repeat(5,1fr);background:#eee;font:11px Arial}figure{margin:4px;height:140px;background:#fff}img{width:100%;height:120px;object-fit:contain}figcaption{text-align:center}</style>${cards.join('')}`)
    await page.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))))
    await page.screenshot({ path: `${output}/sheet-${start / 40 + 1}.png`, fullPage: true })
  }
  await writeFile(`${output}/files.json`, JSON.stringify(entries, null, 2))
  console.log(`Reviewed contact sheets cover ${entries.length} preserved photographs.`)
} finally { await browser.close() }
