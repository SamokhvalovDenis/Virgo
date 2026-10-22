import { createStaticPreview } from '../../scripts/preview.mjs'

/** Share one local production preview lifecycle across browser suites. */
export async function startPreview() {
  return createStaticPreview()
}
