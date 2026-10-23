import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Deterministic resize of the existing salon logo: preserve its artwork and
// proportions, with a white square background for light and dark search results.
// Run only when the original logo changes; committed assets are copied by Vite.
const logo = await readFile('public/images/logo.png')
const sizes = [16, 32, 48, 96, 180, 192]
const browser = await chromium.launch({ headless: true })
let images
try {
  const page = await browser.newPage()
  images = await page.evaluate(async ({ source, sizes }) => {
    const image = new Image()
    image.src = source
    await image.decode()
    return sizes.map(size => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      const context = canvas.getContext('2d')
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, size, size)
      context.imageSmoothingQuality = 'high'
      const scale = size * 0.92 / Math.max(image.naturalWidth, image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
      return { size, base64: canvas.toDataURL('image/png').split(',')[1] }
    })
  }, { source: `data:image/png;base64,${logo.toString('base64')}`, sizes })
} finally { await browser.close() }

const pngs = new Map(images.map(({ size, base64 }) => [size, Buffer.from(base64, 'base64')]))
await writeFile('public/favicon.png', pngs.get(96))
await writeFile('public/apple-touch-icon.png', pngs.get(180))

// ICO entries contain lossless PNG images, supported by modern browsers.
const iconSizes = sizes.filter(size => size !== 180)
const header = Buffer.alloc(6 + 16 * iconSizes.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(iconSizes.length, 4)
let offset = header.length
for (const [index, size] of iconSizes.entries()) {
  const entry = 6 + index * 16
  header[entry] = header[entry + 1] = size
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(pngs.get(size).length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += pngs.get(size).length
}
await writeFile('public/favicon.ico', Buffer.concat([header, ...iconSizes.map(size => pngs.get(size))]))
console.log('Generated favicon.png (96×96), favicon.ico (16/32/48/96/192) and apple-touch-icon.png (180×180) from public/images/logo.png.')
