import { aboutGallery } from './assets'

/** Editable copy and photo order for the O nás section. Photo sources live in assets.ts. */
export const about = {
  eyebrow: 'O NÁS',
  title: 'Příjemné místo pro chvíle odpočinku',
  paragraphs: [
    'Ve Virgo Beauty Studio klademe důraz na individuální přístup, příjemnou atmosféru a péči pro ženy i muže.',
    'Ať už hledáte chvíli odpočinku při masáži, depilaci nebo úpravu obočí a řas, vyberte si péči podle svých potřeb. Těšíme se na vás v Litoměřicích.',
  ],
  benefits: ['Péče podle vašich potřeb', 'Prostor pro odpočinek', 'Pro ženy i muže'],
  ctaText: 'Rezervovat termín',
  gallery: aboutGallery,
} as const
