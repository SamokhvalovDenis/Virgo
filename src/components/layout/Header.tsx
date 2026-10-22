import { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { content } from '../../data/content'
import { navigation } from '../../data/navigation'
import { Brand } from '../ui/Brand'
import { BookingButton } from '../ui/BookingButton'

export function Header() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const header = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus() }
    }
    const closeOnOutside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 1100px)')
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false) }
    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutside)
    desktop.addEventListener('change', closeOnDesktop)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutside)
      desktop.removeEventListener('change', closeOnDesktop)
    }
  }, [open])
  return <header className="site-header" ref={header} onBlur={event => { if (!header.current?.contains(event.relatedTarget)) setOpen(false) }}>
    <div className="container header-inner">
      <Brand variant="original" />
      <nav className="desktop-nav" aria-label={content.common.navigation}>{navigation.map(item => <a href={item.href} key={item.href}>{item.label}</a>)}</nav>
      <BookingButton location="header" className="header-booking" />
      <button className="menu-toggle" ref={trigger} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? content.common.closeMenu : content.common.openMenu} onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    </div>
    <nav id="mobile-menu" className="mobile-nav" aria-label={content.common.navigation} hidden={!open}>
      {navigation.map(item => <a key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
      <BookingButton location="mobile-menu" />
    </nav>
  </header>
}
