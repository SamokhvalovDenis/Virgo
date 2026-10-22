import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import subsetFont from '../node_modules/.cache/virgo-fonts/node_modules/subset-font/index.js'

// Build-time tool only. Retain Latin/Central European letters and punctuation,
// all layout features and the full original weight axis to preserve exact metrics.
const ranges = [[0x20, 0x17f], [0x300, 0x36f], [0x2000, 0x206f], [0x20a0, 0x20cf], [0x2190, 0x2193]]
const text = ranges.map(([first, last]) => Array.from({ length: last - first + 1 }, (_, index) => String.fromCodePoint(first + index)).join('')).join('') + '\u2212\u2215\ufeff\ufffd'
const results = []
await mkdir('public/fonts', { recursive: true })
for (const subset of ['latin', 'latin-ext']) {
  const source = `node_modules/@fontsource-variable/inter/files/inter-${subset}-wght-normal.woff2`
  const original = await readFile(source)
  const buffer = await subsetFont(original, text, { targetFormat: 'woff2' })
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12)
  const file = `/fonts/inter-${subset}-${hash}.woff2`
  await writeFile(`public${file}`, buffer)
  results.push({ subset, source, file, originalBytes: original.length, bytes: buffer.length })
}
await copyFile('node_modules/@fontsource-variable/inter/LICENSE', 'public/fonts/Inter-OFL.txt')
await copyFile('node_modules/@fontsource-variable/playfair-display/LICENSE', 'public/fonts/Playfair-Display-OFL.txt')
const css = await readFile('src/styles/fonts.css', 'utf8')
let face = 0
await writeFile('src/styles/fonts.css', css.replace(/@font-face\s*\{[^}]+\}/g, block => {
  if (face++ >= 2) return block
  const result = results[face - 1]
  return block.replace('font-weight: 400 700', 'font-weight: 100 900')
    .replace(/url\([^)]+\)/, `url('${result.file}')`)
    .replace(/unicode-range:[^;]+;/, face === 1
      ? 'unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+0300-036F,U+2000-206F,U+20A0-20CF,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD;'
      : 'unicode-range: U+0100-017F,U+0300-036F,U+20A0-20CF;')
}))
await mkdir('reports/prelaunch', { recursive: true })
await writeFile('reports/prelaunch/fonts.json', JSON.stringify({ tool: 'subset-font', ranges, weightRange: [100, 900], results }, null, 2))
console.log(JSON.stringify(results.map(({ subset, originalBytes, bytes }) => ({ subset, originalBytes, bytes }))))
