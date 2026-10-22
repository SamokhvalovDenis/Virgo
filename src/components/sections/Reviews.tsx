import { content } from '../../data/content'
import { reviews } from '../../data/reviews'
import { SectionHeading } from '../ui/SectionHeading'
import { ReviewsCarousel } from '../ui/ReviewsCarousel'

export function Reviews() {
  if (!reviews.length) return null
  return <section id="reviews" className="section-space reviews-section" aria-label={content.sections.reviewsTitle}>
    <div className="container">
      <div className="reviews-heading-ornament" aria-hidden="true">
        <span />
        <svg viewBox="0 0 24 28" focusable="false"><path d="M12 0C10 9 8 11 0 14c8 3 10 5 12 14 2-9 4-11 12-14C16 11 14 9 12 0Z" /></svg>
        <span />
      </div>
      <SectionHeading eyebrow={content.sections.reviewsEyebrow} title={content.sections.reviewsTitle} subtitle={content.sections.reviewsSubtitle} centered />
      <ReviewsCarousel reviews={reviews} />
      <div className="reviews-source">
        <p>{content.reviews.selectionNote}</p>
        <details className="reviews-provenance">
          <summary>{content.reviews.provenanceTitle}</summary>
          <p>{content.reviews.provenanceDescription}</p>
        </details>
      </div>
    </div>
  </section>
}

