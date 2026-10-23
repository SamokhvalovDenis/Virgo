export type SiteConfig = {
  name: string;
  locale: string;
  logo: { src: string; alt: string; width: number; height: number };
  location: {
    street: string | null;
    city: string;
    postalCode: string | null;
    country: string;
    fullAddress: string | null;
  };
  contact: {
    phone: string | null;
    phoneHref: string | null;
    email: string | null;
    emailHref: string | null;
  };
  openingHours: { day: string; hours: string }[];
  hoursNote: string | null;
  links: {
    website: string | null;
    booking: string;
    facebook: string | null;
    instagram: string | null;
  };
  seo: {
    title: string;
    description: string;
    canonicalUrl: string | null;
  };
};

export const site: SiteConfig = {
  name: "Beauty Studio Virgo",
  locale: "cs-CZ",
  logo: {
    src: '/images/logo.png',
    alt: 'Virgo Beauty Studio — logo',
    width: 250,
    height: 200,
  },

  location: {
    street: "Masarykova 552/22",
    city: "Litoměřice",
    postalCode: "412 01",
    country: "Česká republika",
    fullAddress:
      "Masarykova 552/22, 412 01 Litoměřice, Česká republika",
  },

  contact: {
    phone: "+420 608 391 605",
    phoneHref: "tel:+420608391605",
    email: "tretiak.oksana86@gmail.com",
    emailHref: "mailto:tretiak.oksana86@gmail.com",
  },

  openingHours: [
    { day: "Pondělí", hours: "08:30–18:00" },
    { day: "Úterý", hours: "08:30–18:00" },
    { day: "Středa", hours: "08:30–18:00" },
    { day: "Čtvrtek", hours: "08:30–18:00" },
    { day: "Pátek", hours: "08:30–18:00" },
    { day: "Sobota", hours: "Zavřeno" },
    { day: "Neděle", hours: "Zavřeno" },
  ],

  hoursNote:
    "Víkendy a další termíny dle telefonické domluvy. O státních svátcích zavřeno.",

  links: {
    website: null,
    booking:
      "https://www.termino.eu/r/beauty-studio-litomerice",
    facebook:
      "https://www.facebook.com/profile.php?id=61562064562357",
    instagram: "https://www.instagram.com/virgo_beauty.studio/",
  },

  seo: {
    canonicalUrl: "https://virgo.beautycz.workers.dev",
    title: "Beauty Studio Virgo | Litoměřice",
    description:
      "Masáže, depilace, péče o obočí a řasy v Litoměřicích. Rezervujte si svůj termín online.",
  },
};

export function getLocationLabel(): string {
  return site.location.fullAddress || [
    site.location.street,
    [site.location.postalCode, site.location.city].filter(Boolean).join(' '),
    site.location.country,
  ].filter(Boolean).join(', ');
}

export function getGoogleMapsUrl(): string | null {
  if (!site.location.fullAddress && !site.location.street) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getLocationLabel())}`;
}
