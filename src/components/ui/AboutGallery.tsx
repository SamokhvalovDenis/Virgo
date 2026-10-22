import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react'
import type { GalleryImage } from '../../data/assets'
import { responsiveImage } from '../../lib/responsiveImage'
import './AboutGallery.css'

type Props = { images: readonly GalleryImage[] }

export function AboutGallery({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const activeImage = activeIndex === null ? undefined : images[activeIndex]

  return <>
    <div className="about-gallery" role="group" aria-label="Fotogalerie studia Virgo">
      {images.map((image, index) => <button
        key={image.id}
        type="button"
        className="about-gallery-tile"
        aria-label={`Zvětšit fotografii ${index + 1} z ${images.length}: ${image.alt}`}
        aria-haspopup="dialog"
        onClick={event => { opener.current = event.currentTarget; setActiveIndex(index) }}
      >
        <img src={image.src} {...responsiveImage(image.src, index === 0
          ? '(max-width: 767px) calc(100vw - 40px), (max-width: 1280px) calc((100vw - 90px) * 2 / 3), 797px'
          : `${index === images.length - 1 ? '(max-width: 767px) calc(100vw - 40px)' : '(max-width: 767px) calc((100vw - 50px) / 2)'}, (max-width: 1280px) calc((100vw - 100px) / 3), 393px`)} alt={image.alt} width={image.width} height={image.height}
          style={{ objectPosition: image.objectPosition }} loading="lazy" decoding="async" />
        <span className="about-gallery-expand" aria-hidden="true"><Expand size={19} strokeWidth={1.5} /></span>
      </button>)}
    </div>
    {activeImage && activeIndex !== null && createPortal(
      <GalleryLightbox images={images} activeIndex={activeIndex}
        onNavigate={direction => setActiveIndex(index => index === null ? null : (index + direction + images.length) % images.length)}
        onClose={() => { setActiveIndex(null); opener.current?.focus({ preventScroll: true }) }} />,
      document.body,
    )}
  </>
}

type LightboxProps = Props & { activeIndex: number; onNavigate: (direction: number) => void; onClose: () => void }

function GalleryLightbox({ images, activeIndex, onNavigate, onClose }: LightboxProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const titleId = useId()
  const captionId = useId()
  const image = images[activeIndex]
  const close = () => { dialog.current?.close(); onClose() }

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const previousOverflow = document.body.style.overflow
    const previousPadding = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${parseFloat(getComputedStyle(document.body).paddingRight) + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    // Native modal dialogs make the rest of the page inert.
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPadding
    }
  }, [])

  return <dialog ref={dialog} className="about-lightbox" aria-modal="true" aria-labelledby={titleId} aria-describedby={captionId}
    onCancel={event => { event.preventDefault(); close() }}
    onClick={event => { if (event.target === event.currentTarget) close() }}
    onKeyDown={event => {
      if (event.key === 'Tab') {
        const controls = dialog.current?.querySelectorAll<HTMLButtonElement>('button')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        onNavigate(event.key === 'ArrowRight' ? 1 : -1)
      }
    }}
    onTouchStart={event => {
      if (event.touches.length !== 1) { touchStart.current = null; return }
      touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    }}
    onTouchEnd={event => {
      const start = touchStart.current
      touchStart.current = null
      if (!start || event.changedTouches.length !== 1) return
      const dx = event.changedTouches[0].clientX - start.x
      const dy = event.changedTouches[0].clientY - start.y
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onNavigate(dx < 0 ? 1 : -1)
    }}
    onTouchCancel={() => { touchStart.current = null }}
  >
    <h2 id={titleId} className="sr-only">Fotogalerie studia Virgo</h2>
    <div className="about-lightbox-toolbar">
      <span className="about-lightbox-counter" role="status" aria-live="polite" aria-atomic="true">{activeIndex + 1} / {images.length}</span>
      <button type="button" className="about-lightbox-control" aria-label="Zavřít fotogalerii" onClick={close} autoFocus><X size={24} strokeWidth={1.5} /></button>
    </div>
    <button type="button" className="about-lightbox-control about-lightbox-previous" aria-label="Předchozí fotografie" onClick={() => onNavigate(-1)}><ArrowLeft size={24} strokeWidth={1.5} /></button>
    <figure className="about-lightbox-figure">
      <img src={image.fullSrc ?? image.src} alt={image.alt} width={image.width} height={image.height} draggable={false} />
      <figcaption id={captionId}>{image.alt}</figcaption>
    </figure>
    <button type="button" className="about-lightbox-control about-lightbox-next" aria-label="Další fotografie" onClick={() => onNavigate(1)}><ArrowRight size={24} strokeWidth={1.5} /></button>
  </dialog>
}
