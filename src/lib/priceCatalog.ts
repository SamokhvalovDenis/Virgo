import type { PriceAudience, PriceCatalog, PriceValue } from '../data/prices.types'

export type DisplayPriceRow = {
  id: string
  label: string
  price: Exclude<PriceValue, null>
  detail?: string
  note?: string | null
}
export type DisplayPriceGroup = { id: string; title: string; note?: string | null; rows: DisplayPriceRow[] }

/** Never infer the other audience's price or duplicate a total across treatments. */
export function getPriceGroups(catalog: PriceCatalog, audience: PriceAudience): DisplayPriceGroup[] {
  return catalog.groups.map(group => {
    const rows: DisplayPriceRow[] = []
    for (const row of group.rows) {
      const price = 'price' in row ? row.price : row[audience]
      if (price === null) continue
      const detail = 'price' in row ? row.detail : (audience === 'women' ? row.womenDetail : row.menDetail) ?? row.detail
      const note = 'price' in row ? row.note : (audience === 'women' ? row.womenNote : row.menNote) ?? row.note
      rows.push({ id: row.id, label: row.label, price, detail, note })
    }
    return { id: group.id, title: group.title, note: group.note, rows }
  }).filter(group => group.rows.length > 0)
}
