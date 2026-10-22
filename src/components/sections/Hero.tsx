import { ArrowDown, CircleCheck, MapPin } from 'lucide-react'
import { aboutGallery } from '../../data/assets'
import { content } from '../../data/content'
import { site } from '../../data/site'
import { responsiveImage } from '../../lib/responsiveImage'
import { Botanical } from '../ui/Botanical'
import { BookingButton } from '../ui/BookingButton'
import { StudioImage } from '../ui/StudioImage'

export function Hero() {
  const eyebrow = content.hero.eyebrow.replace('{name}', site.name).replace('{city}', site.location.city)
  const detailPhotos = content.hero.detailPhotoIds.flatMap(id => aboutGallery.find(photo => photo.id === id) ?? [])

  return <section className="hero-section" aria-labelledby="hero-title">
    <Botanical className="hero-botanical hero-botanical-shadow" />
    <div className="container hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="hero-title"><span>{content.hero.titleLines[0]}</span>{' '}<em>{content.hero.titleLines[1]}</em></h1>
        <p className="hero-subtitle">{content.hero.subtitle}</p>
        <div className="hero-actions"><BookingButton location="hero" /><a className="button button-outline" href="#services">{content.common.exploreServices}<ArrowDown size={17} aria-hidden="true" /></a></div>
      </div>
      <figure className="hero-visual">
        <div className="hero-orbit" aria-hidden="true" />
        <Botanical className="hero-botanical hero-botanical-gold" />
        <div className="hero-photo-frame">
          <StudioImage imageKey={content.photos.hero.imageKey} alt={content.photos.hero.alt} className="hero-photo" sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) 42vw, 454px" priority />
        </div>
        {detailPhotos.map(photo => <div className="hero-detail-frame" key={photo.id}>
          <img src={photo.src} {...responsiveImage(photo.src, '(max-width: 767px) calc(100vw - 40px), (max-width: 1199px) 15vw, 162px')} alt={photo.alt} width={photo.width} height={photo.height} style={{ objectPosition: photo.objectPosition }} loading="lazy" decoding="async" />
        </div>)}
        <div className="hero-emblem" aria-hidden="true">
          <svg viewBox="0 0 64 50" fill="none">
            <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M32 43C17 32 20 18 32 5c12 13 15 27 0 38Z" />
              <path d="M32 43C16 43 8 31 9 17c14 2 23 11 23 26Zm0 0c16 0 24-12 23-26-14 2-23 11-23 26Z" />
              <path d="M32 43C17 49 5 42 2 32c12-5 24-1 30 11Zm0 0c15 6 27-1 30-11-12-5-24-1-30 11Z" />
            </g>
          </svg>
          <span>{content.hero.emblem[0]}<br />{content.hero.emblem[1]}</span>
          <span className="hero-emblem-line" />
        </div>
        <figcaption className="sr-only">{content.hero.note}</figcaption>
      </figure>
      <ul className="hero-highlights">{content.hero.highlights.map(item => <li key={item}><CircleCheck size={27} strokeWidth={1.4} aria-hidden="true" />{item}</li>)}</ul>
    </div>
    <div className="container hero-bottom"><span><MapPin size={15} aria-hidden="true" />{content.hero.location.replace('{city}', site.location.city)}</span><a href="#services">{content.hero.scroll}<ArrowDown size={15} aria-hidden="true" /></a></div>
  </section>
}
