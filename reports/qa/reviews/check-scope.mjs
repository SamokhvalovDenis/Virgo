import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'vite'

// Compare every other data field with the existing pre-refactor snapshot.
const server = await createServer({ envFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-review-scope', server: { middlewareMode: true, hmr: false, watch: null } })
try {
  const data = await server.ssrLoadModule('/src/data/index.ts')
  const details = await server.ssrLoadModule('/src/data/serviceDetails.ts')
  const actual = JSON.parse(JSON.stringify({ data, details }, (_, value) => typeof value === 'function' ? undefined : value))
  const baseline = JSON.parse(await readFile('reports/refactor/content-baseline.json', 'utf8'))
  for (const snapshot of [actual, baseline]) {
    delete snapshot.data.reviews
    delete snapshot.data.content.reviews
  }
  assert.deepEqual(actual, baseline, 'All data outside reviews and review copy remain unchanged')
  await writeFile('reports/qa/reviews/scope-results.json', JSON.stringify({ unchangedOutsideReviews: true, reference: 'reports/refactor/content-baseline.json', excluded: ['data.reviews', 'data.content.reviews'] }, null, 2) + '\n')
  console.log('All data outside reviews and review copy match the original baseline.')
} finally {
  await server.close()
}
