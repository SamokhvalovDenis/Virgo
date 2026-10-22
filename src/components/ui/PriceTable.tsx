import { content } from '../../data/content'
import { formatPrice } from '../../data/prices'
import type { DisplayPriceGroup } from '../../lib/priceCatalog'
import { BookingButton } from './BookingButton'
import { PriceBotanical } from './PriceBotanical'

type Props = { group: DisplayPriceGroup; categoryId: string; audienceLabel?: string }

export function PriceTable({ group, categoryId, audienceLabel }: Props) {
  return <div className="price-group">
    <PriceBotanical className="price-card-botanical" />
    <div className="price-group-heading">
      <h4>{group.title}</h4>
      <span className="price-group-count" aria-hidden="true">{group.rows.length}</span>
    </div>
    <div className="price-group-body">
    <table role="table">
      <caption className="sr-only">{[group.title, audienceLabel].filter(Boolean).join(' — ')}</caption>
      <thead className="sr-only" role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">{content.sections.pricesService}</th>
          <th scope="col" role="columnheader">{content.sections.pricesPrice}</th>
          <th scope="col" role="columnheader">{content.sections.pricesBooking}</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {group.rows.map(row => {
          const procedure = [row.label, row.detail, audienceLabel].filter(Boolean).join(' — ')
          return <tr key={row.id} data-price-id={row.id} className="price-procedure" role="row">
            <th scope="row" role="rowheader">
              <span className="price-row-label">{row.label}</span>
              {row.detail && <span className="price-row-detail">{row.detail}</span>}
              {row.note && <span className="price-row-note">{row.note}</span>}
            </th>
            <td className="price-value" role="cell">{formatPrice(row.price)}</td>
            <td className="price-booking-cell" role="cell">
              <BookingButton
                location={`price-${categoryId}-${row.id}`}
                label={content.sections.serviceBooking}
                variant="burgundy"
                className="price-row-booking"
                ariaLabel={content.common.bookProcedure.replace('{procedure}', procedure)}
              />
            </td>
          </tr>
        })}
      </tbody>
    </table>
    </div>
  </div>
}
