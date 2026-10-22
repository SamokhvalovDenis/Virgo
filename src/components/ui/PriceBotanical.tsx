import { useId, type CSSProperties } from 'react'

/** Lightweight, reusable leaf artwork. All decoration stays outside the accessibility tree. */
export function PriceBotanical({ className = '' }: { className?: string }) {
  const id = useId()
  const leafId = `${id}-leaf`
  const wineId = `${id}-wine`
  const goldId = `${id}-gold`

  return <svg className={`price-botanical ${className}`} viewBox="0 0 460 680" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={wineId} x1="0" y1="0" x2="110" y2="-90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#9c5161" stopOpacity=".2" />
        <stop offset=".55" stopColor="#b77873" stopOpacity=".48" />
        <stop offset="1" stopColor="#d6a586" stopOpacity=".7" />
      </linearGradient>
      <linearGradient id={goldId} x1="0" y1="0" x2="110" y2="-90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#98603f" stopOpacity=".3" />
        <stop offset=".6" stopColor="#d5ae69" stopOpacity=".8" />
        <stop offset="1" stopColor="#f1d7a2" />
      </linearGradient>
      <g id={leafId} stroke="currentColor" strokeWidth=".7" strokeLinejoin="round">
        <path d="M0 0C-4-57 66-66 112-105C93-56 66 8 0 0Z" fill="var(--price-leaf-fill)" />
        <path d="M0 0Q60-56 112-105M17-17 15-36M29-28 32-51M42-40 53-64M56-52 76-77M20-19 43-16M35-33 62-33M52-49 79-53M72-68 94-74" opacity=".6" />
      </g>
    </defs>
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <path d="M48 680C46 537 186 477 218 347S280 130 420 18M103 548C76 451 52 376 18 297M178 449C274 441 346 388 419 305M250 247C344 230 397 186 442 126" />
      <g style={{ '--price-leaf-fill': `url(#${wineId})` } as CSSProperties}>
        <use href={`#${leafId}`} transform="translate(92 571) rotate(-87) scale(1.35)" />
        <use href={`#${leafId}`} transform="translate(139 503) rotate(26) scale(1.25)" />
        <use href={`#${leafId}`} transform="translate(206 382) rotate(-102) scale(1.45)" />
        <use href={`#${leafId}`} transform="translate(234 300) rotate(20) scale(1.3)" />
        <use href={`#${leafId}`} transform="translate(273 202) rotate(-97) scale(1.4)" />
        <use href={`#${leafId}`} transform="translate(324 129) rotate(5) scale(1.2)" />
        <use href={`#${leafId}`} transform="translate(384 56) rotate(-75) scale(1.15)" />
        <use href={`#${leafId}`} transform="translate(63 431) rotate(-104) scale(.8)" />
        <use href={`#${leafId}`} transform="translate(340 377) rotate(12) scale(.9)" />
      </g>
      <g style={{ '--price-leaf-fill': `url(#${goldId})` } as CSSProperties}>
        <use href={`#${leafId}`} transform="translate(179 445) rotate(-127) scale(.85)" />
        <use href={`#${leafId}`} transform="translate(289 423) rotate(-49) scale(.65)" />
        <use href={`#${leafId}`} transform="translate(354 207) rotate(-26) scale(.68)" />
      </g>
      <path d="M50 641Q15 568 23 507M227 322Q330 314 376 257M303 156Q240 95 236 52" />
      <g fill="currentColor" strokeWidth=".6">
        <circle cx="23" cy="507" r="5" /><circle cx="376" cy="257" r="5" /><circle cx="236" cy="52" r="5" />
      </g>
    </g>
  </svg>
}
