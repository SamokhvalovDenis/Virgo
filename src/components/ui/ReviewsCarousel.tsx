import { useId, useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { content } from '../../data/content'
import { type StudioReview } from '../../data/reviews'
import { ReviewCard } from './ReviewCard'
import './ReviewsCarousel.css'

const breakpoints = ['(min-width: 768px)', '(min-width: 1100px)']

function subscribeToViewport(onChange: () => void) {
  const queries = breakpoints.map(query => window.matchMedia(query))
  queries.forEach(query => query.addEventListener('change', onChange))
  return () => queries.forEach(query => query.removeEventListener('change', onChange))
}

function getVisibleCount() {
  return 1 + breakpoints.filter(query => window.matchMedia(query).matches).length
}

export function ReviewsCarousel({ reviews }: { reviews: readonly StudioReview[] }) {
  const visibleCount = useSyncExternalStore(subscribeToViewport, getVisibleCount, () => 3)
  const [page, setPage] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const trackId = useId()
  const instructionsId = useId()
  const pageCount = Math.ceil(reviews.length / visibleCount)
  const currentPage = Math.min(page, Math.max(0, pageCount - 1))
  const start = Math.min(currentPage * visibleCount, Math.max(0, reviews.length - visibleCount))
  const end = Math.min(start + visibleCount, reviews.length)
  const goToPage = (next: number) => setPage(Math.max(0, Math.min(pageCount - 1, next)))

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    switch (event.key) {
      case 'ArrowLeft': goToPage(currentPage - 1); break
      case 'ArrowRight': goToPage(currentPage + 1); break
      case 'Home': goToPage(0); break
      case 'End': goToPage(pageCount - 1); break
      default: return
    }
    event.preventDefault()
  }

  if (!reviews.length) return null

  return <div className="reviews-carousel" role="region" aria-roledescription={content.reviews.carousel} aria-label={content.reviews.carouselLabel}>
    <p id={instructionsId} className="sr-only">{content.reviews.keyboardHelp}</p>
    <div
      className="reviews-viewport"
      tabIndex={0}
      role="group"
      aria-label={content.reviews.carouselLabel}
      aria-describedby={instructionsId}
      onKeyDown={handleKeyDown}
      onTouchStart={event => {
        const touch = event.touches.length === 1 ? event.touches[0] : null
        touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
      }}
      onTouchMove={event => { if (event.touches.length !== 1) touchStart.current = null }}
      onTouchCancel={() => { touchStart.current = null }}
      onTouchEnd={event => {
        const origin = touchStart.current
        touchStart.current = null
        const touch = event.changedTouches[0]
        if (!origin || !touch) return
        const dx = touch.clientX - origin.x
        const dy = touch.clientY - origin.y
        if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goToPage(currentPage + (dx < 0 ? 1 : -1))
      }}
    >
      <div
        id={trackId}
        className="reviews-track"
        style={{
          transform: `translateX(calc(-${start * 100 / visibleCount}% - ${start / visibleCount} * var(--reviews-gap)))`,
        } as CSSProperties}
      >
        {reviews.map((review, index) => {
          const hidden = index < start || index >= end
          return <div className="reviews-slide" key={review.id} role="group" aria-roledescription={content.reviews.slide} aria-label={`${index + 1} / ${reviews.length}`} aria-hidden={hidden || undefined} inert={hidden}>
            <ReviewCard review={review} />
          </div>
        })}
      </div>
    </div>
    <div className="reviews-controls">
      <button type="button" className="reviews-arrow" aria-label={content.reviews.previous} aria-controls={trackId} disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)}>
        <ArrowLeft size={19} aria-hidden="true" />
      </button>
      <div className="reviews-pages" role="group" aria-label={content.reviews.pages}>
        {Array.from({ length: pageCount }, (_, index) => <button
          key={index}
          type="button"
          className="reviews-page"
          aria-label={`${content.reviews.page} ${index + 1} / ${pageCount}`}
          aria-controls={trackId}
          aria-current={currentPage === index ? 'true' : undefined}
          onClick={() => goToPage(index)}
        ><span /></button>)}
      </div>
      <button type="button" className="reviews-arrow" aria-label={content.reviews.next} aria-controls={trackId} disabled={currentPage === pageCount - 1} onClick={() => goToPage(currentPage + 1)}>
        <ArrowRight size={19} aria-hidden="true" />
      </button>
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {content.reviews.visible} {start + 1}–{end} / {reviews.length}
    </p>
  </div>
}
