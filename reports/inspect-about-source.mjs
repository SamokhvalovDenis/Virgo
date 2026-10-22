import { chromium } from 'playwright'
import { readFile, mkdir, writeFile } from 'node:fs/promises'

const inventory = JSON.parse(await readFile('reports/virgo-images.json', 'utf8'))
const photos = [...new Map(inventory.images.filter(image => image.section === 'Virgo studio').map(image => [image.file, image])).values()]
await mkdir('reports/about-gallery', { recursive: true })
await mkdir('public/images/about/gallery', { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.goto('https://virgostudio.godaddysites.com/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1200)
  await page.getByRole('heading', { name: 'O nás', exact: true }).evaluate(element => element.scrollIntoView({ behavior: 'instant', block: 'start' }))
  await page.screenshot({ path: 'reports/about-gallery/original-site.png' })
  const results = []
  for (const photo of photos) {
    const url = photo.originalUrl.split('/:/')[0]
    const response = await page.request.get(url)
    if (!response.ok()) throw new Error(`${response.status()} ${url}`)
    const bytes = await response.body()
    const name = photo.file.split('/').at(-1)
    await writeFile(`public/images/about/gallery/${name}`, bytes)
    const dimensions = await page.evaluate(async ({ data, mime }) => {
      const img = new Image()
      img.src = `data:${mime};base64,${data}`
      await img.decode()
      return { width: img.naturalWidth, height: img.naturalHeight }
    }, { data: bytes.toString('base64'), mime: response.headers()['content-type'] })
    const thumbnail = await page.evaluate(async ({ data, mime }) => {
      const img = new Image()
      img.src = `data:${mime};base64,${data}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d').drawImage(img, 0, 0)
      return canvas.toDataURL('image/webp', 0.85).split(',')[1]
    }, { data: bytes.toString('base64'), mime: response.headers()['content-type'] })
    const thumbnailName = name.replace(/\.(png|jpg)$/, '.webp')
    const thumbnailBytes = Buffer.from(thumbnail, 'base64')
    await writeFile(`public/images/about/gallery/${thumbnailName}`, thumbnailBytes)
    results.push({ file: `/images/about/gallery/${name}`, thumbnail: `/images/about/gallery/${thumbnailName}`, originalFile: photo.file, url, bytes: bytes.length, thumbnailBytes: thumbnailBytes.length, ...dimensions })
  }
  await writeFile('reports/about-gallery/source-images.json', JSON.stringify(results, null, 2) + '\n')
  console.log(JSON.stringify(results, null, 2))
} finally {
  await browser.close()
}
