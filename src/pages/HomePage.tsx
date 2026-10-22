import { useState } from 'react'
import { Hero } from '../components/sections/Hero'
import { Services } from '../components/sections/Services'
import { PriceList } from '../components/sections/PriceList'
import { About } from '../components/sections/About'
import { Reviews } from '../components/sections/Reviews'
import { GiftCards } from '../components/sections/GiftCards'
import { Faq } from '../components/sections/Faq'
import { Contact } from '../components/sections/Contact'

export function HomePage() {
  const [topic, setTopic] = useState('')
  return <>
    <Hero />
    <Services />
    <PriceList />
    <About />
    <Reviews />
    <GiftCards onChooseTopic={setTopic} />
    <Faq />
    <Contact topic={topic} onTopicChange={setTopic} />
  </>
}
