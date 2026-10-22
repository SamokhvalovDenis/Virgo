import { readFile, writeFile } from 'node:fs/promises'

// Read-only source extraction: pair matching ABOUT_* indices within each section.
const html = await readFile(new URL('./virgo-services-source.html', import.meta.url), 'utf8')
const inventory = JSON.parse(await readFile(new URL('./virgo-images.json', import.meta.url), 'utf8'))
const decode = value => value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
const text = value => decode(value.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
const categories = ['Masáže', 'Depilace', 'Trvalé odstranění chloupků', 'Péče o obočí a řasy']
const result = []
for (const section of html.matchAll(/<section\b[^>]*>([\s\S]*?)<\/section>/g)) {
  const body = section[1]
  const category = text(body.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '')
  if (!categories.includes(category)) continue
  for (const heading of body.matchAll(/<h4\b[^>]*data-aid="ABOUT_HEADLINE_RENDERED(\d+)"[^>]*>([\s\S]*?)<\/h4>/g)) {
    const index = Number(heading[1])
    const image = [...body.matchAll(/<img\b[^>]*>/g)].find(match => match[0].includes(`data-aid="ABOUT_IMAGE_RENDERED${index}"`))?.[0]
    const url = image?.match(/data-srclazy="([^"]+)"/)?.[1] ?? image?.match(/\ssrc="([^"]+)"/)?.[1]
    const sourceImage = url ? decode(url).replace(/^\/\//, 'https://') : null
    const originalAsset = sourceImage?.split('/:')[0]
    const candidates = inventory.images.filter(item => item.status === 'downloaded' && item.originalUrl.split('/:')[0] === originalAsset)
    const description = body.match(new RegExp(`<div[^>]*data-aid="ABOUT_DESCRIPTION_RENDERED${index}"[^>]*>([\\s\\S]*?)<\\/div>`))?.[1] ?? ''
    result.push({ category, index, title: text(heading[2]), sourceImage,
      exactFile: candidates.find(item => item.originalUrl === sourceImage)?.file ?? null,
      candidates: candidates.map(item => ({ file: item.file, url: item.originalUrl })),
      paragraphs: [...description.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(match => ({ type: match[1], text: text(match[2]) })).filter(item => item.text),
      listItems: [...description.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map(match => text(match[1])),
    })
  }
}
await writeFile(new URL('./virgo-service-source.json', import.meta.url), JSON.stringify({ source: inventory.source, blocks: result }, null, 2) + '\n')
for (const block of result) console.log(JSON.stringify({ category: block.category, title: block.title, file: block.exactFile, source: block.sourceImage?.split('/').at(-2), candidates: block.candidates.length, paragraphs: block.paragraphs }))
