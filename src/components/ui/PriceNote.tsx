import { Info } from 'lucide-react'

/** Empty notes leave no decoration or space in the price card. */
export function PriceNote({ note }: { note?: string | null }) {
  const text = note?.trim()
  if (!text) return null

  return <div className="price-row-note">
    <Info size={16} aria-hidden="true" />
    <p>{text}</p>
  </div>
}
