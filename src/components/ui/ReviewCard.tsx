import { BookOpen, Star } from 'lucide-react'
import { content } from '../../data/content'
import { type StudioReview } from '../../data/reviews'

export function ReviewCard({ review }: { review: StudioReview }) {
  const rating = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 }).format(review.rating)
  const date = review.date?.split('-').reverse().join('.')
  const isBrowTreatment = /obočí|lash lifting/i.test(review.service)

  return <figure className="review-card" data-long={review.text.length > 130 || undefined}>
    <svg className="review-corner" viewBox="0 0 112 84" aria-hidden="true" focusable="false">
      <path d="M1 0c30 4 27 18 48 24s16 14 25 17 3 12 14 18 17 12 24 24" fill="none" stroke="currentColor" strokeWidth=".8" />
      <path d="M88 11c-2 9-4 11-11 14 7 2 9 5 11 13 2-8 4-11 11-13-7-3-9-5-11-14Z" fill="currentColor" />
    </svg>
    <div className="review-card-top">
      <div className="review-rating" role="img" aria-label={`Hodnocení ${rating} z 5`}>
        <span className="review-stars" aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => <span className="review-star" key={index}>
            <Star className="review-star-outline" size={16} />
            <span className="review-star-fill" style={{ width: `${Math.min(1, Math.max(0, review.rating - index)) * 100}%` }}>
              <Star size={16} fill="currentColor" />
            </span>
          </span>)}
        </span>
        <span className="review-rating-value" aria-hidden="true">{rating} / 5</span>
      </div>
      {review.date && <time dateTime={review.date}>{date}</time>}
    </div>
    <blockquote>
      <p>{review.text}</p>
      <span className="review-quote-mark review-quote-open" aria-hidden="true">“</span>
      <span className="review-quote-mark review-quote-close" aria-hidden="true">”</span>
    </blockquote>
    <figcaption>
      <svg className="review-service-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
        {isBrowTreatment ? <>
          <path d="M4 26c8-12 23-17 39-11M5 20C14 5 31 5 42 12M10 28c8 7 19 8 29-1M14 31l-2 4m8-2-1 5m7-4v5m6-6 2 4m4-7 3 3" />
        </> : <>
          <path d="M24 5c-10 11-11 22 0 34 11-12 10-23 0-34Z" />
          <path d="M17 17c-4-4-8-5-11-5 0 13 6 23 18 27M31 17c4-4 8-5 11-5 0 13-6 23-18 27M9 25l-7-1c3 13 11 18 22 15M39 25l7-1c-3 13-11 18-22 15" />
        </>}
      </svg>
      <span className="review-service">{review.service}</span>
      <span className="review-source-label">
        <BookOpen size={14} aria-hidden="true" />{content.reviews.sourceLabel}
      </span>
    </figcaption>
  </figure>
}
