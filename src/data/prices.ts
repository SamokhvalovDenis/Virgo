import type { GenderPriceRow, PriceCatalog, PriceRow, PriceValue, SinglePriceRow } from "./prices.types";
import { content } from './content';
import { site } from './site';
import { getServiceTitle } from './services';

/**
 * Примітки редагуються тут, без змін React-компонентів:
 * - note: "Підтверджений текст чеською" у позиції — під її ціною та Rezervovat.
 * - note у групі priceCatalogs — один раз внизу всієї картки з варіантами.
 * - womenNote / menNote — уточнення лише для відповідної аудиторії.
 * Щоб прибрати примітку, видаліть поле або вкажіть null / "".
 * Приклад із частинами тіла додавайте лише до підтвердженої процедури.
 */

/**
 * Source: references/depilation-price-original.png (user-provided)
 * All amounts in CZK; MUST reconfirm with studio owner before launch.
 * IMPORTANT: Не підтверджено, чи цей прайс стосується waxing, sugaring чи обох.
 */

export const priceGroups = [
  { id: "face", title: "Obličej a krk" },
  { id: "arms", title: "Ruce" },
  { id: "body", title: "Tělo" },
  { id: "back", title: "Záda" },
  { id: "legs", title: "Nohy" },
  { id: "buttocks", title: "Hýždě" },
] as const;

export const depilationPrices: PriceRow[] = [
  {
    id: "depilation-face", groupId: "face", label: "Obličej", women: 450, men: 450,
  },
  { id: "depilation-eyebrows", groupId: "face", label: "Obočí", women: 200, men: 250 },
  { id: "depilation-upper-lip", groupId: "face", label: "Horní ret", women: 200, men: 250 },
  { id: "depilation-chin", groupId: "face", label: "Brada", women: 250, men: 250 },
  { id: "depilation-nostrils", groupId: "face", label: "Nosní dírky", women: 200, men: 300 },
  { id: "depilation-ears", groupId: "face", label: "Uši", women: 200, men: 300 },
  { id: "depilation-cheeks", groupId: "face", label: "Tváře", women: 300, men: 300 },
  { id: "depilation-neck", groupId: "face", label: "Krk", women: 200, men: 300 },

  { id: "depilation-arms-forearms", groupId: "arms", label: "Předloktí", women: 400, men: 490 },
  { id: "depilation-arms-upper", groupId: "arms", label: "Nadloktí", women: 350, men: 450 },
  { id: "depilation-arms-full", groupId: "arms", label: "Celé ruce", women: 550, men: { from: 750, to: 850 } },
  { id: "depilation-arms-fingers", groupId: "arms", label: "Prsty na rukou", women: 110, men: 150 },

  { id: "depilation-chest", groupId: "body", label: "Hruď", women: 450, men: 600 },
  { id: "depilation-stomach", groupId: "body", label: "Břicho", women: 400, men: 500 },
  { id: "depilation-navel", groupId: "body", label: "Pupek", women: 150, men: 170 },
  { id: "depilation-armpits", groupId: "body", label: "Podpaží", women: 400, men: 400 },

  { id: "depilation-back-lower", groupId: "back", label: "Spodní část zad", women: 300, men: 600 },
  { id: "depilation-back-upper", groupId: "back", label: "Horní část zad", women: 400, men: 500 },
  { id: "depilation-back-full", groupId: "back", label: "Celá záda", women: 700, men: 950 },

  { id: "depilation-legs-calves", groupId: "legs", label: "Lýtka (včetně kolen)", women: 500, men: 700 },
  { id: "depilation-legs-three-quarters", groupId: "legs", label: "¾ nohou (do poloviny stehna)", women: 800, men: 1050 },
  { id: "depilation-legs-thighs", groupId: "legs", label: "Stehna", women: 500, men: 650 },
  { id: "depilation-legs-full", groupId: "legs", label: "Celé nohy (bez třísel a prstů)", women: 850, men: 1200 },
  { id: "depilation-legs-toes", groupId: "legs", label: "Prsty na nohou", women: 150, men: 200 },

  { id: "depilation-buttocks-inner", groupId: "buttocks", label: "Hýždě zevnitř", women: 200, men: 350 },
  { id: "depilation-buttocks-outer", groupId: "buttocks", label: "Hýždě zvenčí", women: 400, men: 530 },
  { id: "depilation-buttocks-complex", groupId: "buttocks", label: "Hýždě komplex", women: 550, men: 750 },
];


/**
 * Transcribed from the downloaded originals in reports/virgo-images.json.
 * Each unique sheet is entered once; resized/cropped copies are not new prices.
 * Source IDs are provenance only: the website renders HTML, never price images.
 */
export const priceSources = {
  "brows": {
    "title": "Péče o obočí a řasy",
    "file": "/images/virgo-original/virgo-3c06e8b3513e.jpg"
  },
  "depilation-body": {
    "title": "Depilace — Ženy / Muži",
    "file": "/images/virgo-original/virgo-291868b11987.jpg"
  },
  "massage-special": {
    "title": "Masáže, maderoterapie a zábaly",
    "file": "/images/virgo-original/virgo-cc4f36a2336a.jpg"
  },
  "depilation-women": {
    "title": "Depilace dámská",
    "file": "/images/virgo-original/virgo-93e2db7cda04.jpg"
  },
  "depilation-men": {
    "title": "Depilace pánská",
    "file": "/images/virgo-original/virgo-8e3a1a28b192.jpg"
  },
  "device-men": {
    "title": "Přístrojové odstranění chloupků — Muži",
    "file": "/images/virgo-original/virgo-ed1dd2234a02.jpg"
  },
  "device-women": {
    "title": "Přístrojové odstranění chloupků — Ženy",
    "file": "/images/virgo-original/virgo-becadaa5816c.jpg"
  },
  "device-packages-women": {
    "title": "Přístrojové ošetření — Balíčky pro ženy",
    "file": "/images/virgo-original/virgo-d65c367ca605.jpg"
  },
  "device-packages-men": {
    "title": "Přístrojové ošetření — Balíčky pro muže",
    "file": "/images/virgo-original/virgo-12d8cc1ec8a5.jpg"
  },
  "massage-classic": {
    "title": "Masáže — jednotlivé procedury a balíčky",
    "file": "/images/virgo-original/virgo-8b06e6967a1f.jpg"
  }
} as const;

export const additionalDepilationPrices: (GenderPriceRow & { groupId: string })[] = [
  {
    "id": "depilation-extra-bikini-classic",
    "groupId": "intimate",
    "label": "Klasické bikiny",
    "women": 500,
    "men": 650,
    "sourceIds": [
      "depilation-women",
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-bikini-medium",
    "groupId": "intimate",
    "label": "Střední bikiny",
    "women": 750,
    "men": 900,
    "sourceIds": [
      "depilation-women",
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-brazil-triangle",
    "groupId": "intimate",
    "label": "Brazilská — trojúhelník / proužek",
    "women": 1000,
    "men": 1200,
    "sourceIds": [
      "depilation-women",
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-brazil-hollywood",
    "groupId": "intimate",
    "label": "Brazilská Hollywood",
    "women": 1000,
    "men": 1200,
    "sourceIds": [
      "depilation-women",
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-bikini-vajacial",
    "groupId": "intimate",
    "label": "Bikiny + vajacial",
    "women": 1250,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-s-brazil-vajacial",
    "groupId": "intimate",
    "label": "S-Brazilská + vajacial",
    "women": 1500,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-hollywood-vajacial",
    "groupId": "intimate",
    "label": "Hollywood + vajacial",
    "women": 1750,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-underarms-calves",
    "groupId": "combinations",
    "label": "Podpaží + lýtka",
    "women": 850,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-underarms-bikini",
    "groupId": "combinations",
    "label": "Podpaží + bikiny",
    "women": 1100,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-fitness-legs",
    "groupId": "combinations",
    "label": "Fitness: podpaží + celé nohy + třísla",
    "women": 1550,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-fitness-half-legs",
    "groupId": "combinations",
    "label": "Fitness: podpaží + polovina nohou + třísla",
    "women": 1250,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-fitness-arms-legs",
    "groupId": "combinations",
    "label": "Fitness: podpaží + celé nohy + celé ruce + třísla",
    "women": 2000,
    "men": null,
    "sourceIds": [
      "depilation-women"
    ]
  },
  {
    "id": "depilation-extra-chest-abdomen",
    "groupId": "combinations",
    "label": "Hruď + břicho",
    "women": null,
    "men": 900,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-back-triceps",
    "groupId": "combinations",
    "label": "Celá záda + tricepsová zóna (k lokti)",
    "women": null,
    "men": 1200,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-bsc",
    "groupId": "intimate",
    "label": "BSC: záda + vnitřní část hýždí + intimní část",
    "women": null,
    "men": 1390,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-brazil-intimate",
    "groupId": "intimate",
    "label": "Brazilská: intimní části + dolní část břicha + třísla",
    "women": null,
    "men": 1650,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-brazil-sport",
    "groupId": "intimate",
    "label": "Brazilská sportovní (dolní část břicha)",
    "women": null,
    "men": 870,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-brazil-manjacial",
    "groupId": "intimate",
    "label": "Brazilská + manjacial",
    "women": null,
    "men": 2700,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-cyclists",
    "groupId": "combinations",
    "label": "Pro cyklisty: celé nohy + třísla",
    "women": null,
    "men": 1620,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-fitness-torso",
    "groupId": "combinations",
    "label": "Fitness: hruď + břicho + záda",
    "women": null,
    "men": 1670,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-in-hollywood",
    "groupId": "combinations",
    "label": "IN: Brazilská Hollywood + celé hýždě",
    "women": null,
    "men": 2200,
    "sourceIds": [
      "depilation-men"
    ]
  },
  {
    "id": "depilation-extra-whole-body",
    "groupId": "combinations",
    "label": "Celé tělo",
    "women": null,
    "men": 6100,
    "sourceIds": [
      "depilation-men"
    ],
    "menNote": "Kauce 2 000 Kč."
  }
];

export const massagePrices: (SinglePriceRow & { groupId: string })[] = [
  {
    "id": "massage-price-whole-30",
    "label": "Regenerační a relaxační masáž",
    "price": 500,
    "detail": "30 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ],
    "note": "Při masáži si můžete zvolit, na které partie se zaměříme: záda, šíji, horní nebo dolní končetiny."
  },
  {
    "id": "massage-price-whole-60",
    "label": "Regenerační a relaxační masáž",
    "price": 1000,
    "detail": "60 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ],
    "note": "Při masáži si můžete zvolit, na které partie se zaměříme: záda, šíji, horní nebo dolní končetiny."
  },
  {
    "id": "massage-price-whole-90",
    "label": "Regenerační a relaxační masáž",
    "price": 1500,
    "detail": "90 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ],
    "note": "Při masáži si můžete zvolit, na které partie se zaměříme: záda, šíji, horní nebo dolní končetiny."
  },
  {
    "id": "massage-price-whole-120",
    "label": "Regenerační a relaxační masáž",
    "price": 1900,
    "detail": "120 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ],
    "note": "Při masáži si můžete zvolit, na které partie se zaměříme: záda, šíji, horní nebo dolní končetiny."
  },
  {
    "id": "massage-price-face",
    "label": "Masáž obličeje",
    "price": 500,
    "detail": "30 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-neck",
    "label": "Masáž šíje",
    "price": 350,
    "detail": "20 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-feet",
    "label": "Masáž chodidel",
    "price": 350,
    "detail": "20 min",
    "groupId": "body",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-cupping",
    "label": getServiceTitle('massage-cupping'),
    "price": 550,
    "detail": "30 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-honey",
    "label": getServiceTitle('massage-honey'),
    "price": 600,
    "detail": "30 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-chocolate",
    "label": getServiceTitle('massage-chocolate'),
    "price": 1100,
    "detail": "60 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-hot-stones",
    "label": getServiceTitle('massage-hot-stones'),
    "price": 1100,
    "detail": "60 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-anticellulite-60",
    "label": getServiceTitle('massage-anticellulite'),
    "price": 1100,
    "detail": "60 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-anticellulite-90",
    "label": getServiceTitle('massage-anticellulite'),
    "price": 1600,
    "detail": "90 min",
    "groupId": "special",
    "sourceIds": [
      "massage-classic"
    ]
  },
  {
    "id": "massage-price-madero-60",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 1100,
    "detail": "60 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-madero-90",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 1600,
    "detail": "90 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-madero-3-60",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 3000,
    "detail": "3 × 60 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-madero-5-60",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 4900,
    "detail": "5 × 60 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-madero-3-90",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 4500,
    "detail": "3 × 90 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-madero-5-90",
    "label": getServiceTitle('massage-maderotherapy'),
    "price": 7200,
    "detail": "5 × 90 min",
    "groupId": "madero",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-cinnamon-mud",
    "label": "Skořicový / ozonový zábal",
    "price": 500,
    "detail": "1 × 20–30 min",
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-cinnamon-mud-3",
    "label": "Skořicový / ozonový zábal",
    "price": 1300,
    "detail": "3 ošetření",
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-cinnamon-mud-5",
    "label": "Skořicový / ozonový zábal",
    "price": 2300,
    "detail": "5 ošetření",
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-cinnamon-mud-10",
    "label": "Skořicový / ozonový zábal",
    "price": 4600,
    "detail": "10 ošetření",
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-paraffin-hands",
    "label": "Parafínový zábal rukou",
    "price": 290,
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-paraffin-feet",
    "label": "Parafínový zábal nohou",
    "price": 320,
    "groupId": "wraps",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-indian-head",
    "label": getServiceTitle('massage-indian-head'),
    "price": 1000,
    "detail": "60 min",
    "groupId": "relax",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-thai-feet",
    "label": getServiceTitle('massage-thai-feet'),
    "price": 1000,
    "detail": "60 min",
    "groupId": "relax",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-ayurveda",
    "label": getServiceTitle('massage-ayurveda'),
    "price": 2200,
    "detail": "120 min",
    "groupId": "relax",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-lymphatic",
    "label": "Manuální lymfodrenáž",
    "price": 1100,
    "detail": "60 min",
    "groupId": "relax",
    "sourceIds": [
      "massage-special"
    ]
  },
  {
    "id": "massage-price-lymphatic-90",
    "label": "Manuální lymfodrenáž",
    "price": 1600,
    "detail": "90 min",
    "groupId": "relax",
    "sourceIds": [
      "massage-special"
    ]
  }
];

export const browsLashesPrices: (SinglePriceRow & { groupId: string })[] = [
  {
    "id": "brow-price-correction-women",
    "label": "Úprava obočí",
    "price": 250,
    "groupId": "brows",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-color",
    "label": "Barvení obočí",
    "price": 300,
    "groupId": "brows",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-color-correction",
    "label": "Barvení + úprava obočí",
    "price": 500,
    "groupId": "brows",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-lamination-correction",
    "label": "Laminace + úprava obočí",
    "price": 1000,
    "groupId": "brows",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-lamination-color-correction",
    "label": "Laminace + barvení + úprava obočí",
    "price": 1200,
    "groupId": "brows",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-lashes-color",
    "label": "Barvení řas",
    "price": 300,
    "groupId": "lashes",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-lashes-lamination",
    "label": "Laminace řas",
    "price": 950,
    "groupId": "lashes",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-lashes-lamination-color",
    "label": "Laminace + barvení řas",
    "price": 1100,
    "groupId": "lashes",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-both-lamination",
    "label": `${getServiceTitle('brows-lamination')} + řas`,
    "price": 1800,
    "groupId": "combined",
    "sourceIds": [
      "brows"
    ]
  },
  {
    "id": "brow-price-both-complex",
    "label": "Komplex obočí + řasy",
    "price": 2100,
    "groupId": "combined",
    "sourceIds": [
      "brows"
    ]
  }
];

export const deviceHairRemovalPrices: (GenderPriceRow & { groupId: string })[] = [
  {
    "id": "device-face",
    "groupId": "face",
    "label": "Obličej",
    "women": 1400,
    "men": 1800,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-upper-lip",
    "groupId": "face",
    "label": "Horní ret",
    "women": 450,
    "men": null,
    "detail": "5 min",
    "sourceIds": [
      "device-women"
    ]
  },
  {
    "id": "device-beard-contours",
    "groupId": "face",
    "label": "Úprava kontur vousů",
    "women": null,
    "men": 850,
    "detail": "5 min",
    "sourceIds": [
      "device-men"
    ]
  },
  {
    "id": "device-chin",
    "groupId": "face",
    "label": "Brada",
    "women": 550,
    "men": 1000,
    "detail": "5 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-between-brows",
    "groupId": "face",
    "label": "Mezi obočím",
    "women": 400,
    "men": 450,
    "detail": "5 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-neck-back",
    "groupId": "face",
    "label": "Zadní partie krku",
    "women": 550,
    "men": 1050,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-neck-front",
    "groupId": "face",
    "label": "Přední partie krku",
    "women": 550,
    "men": 1050,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-underarms",
    "groupId": "arms",
    "label": "Podpaží",
    "women": 800,
    "men": 900,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-forearms",
    "groupId": "arms",
    "label": "Předloktí",
    "women": 1400,
    "men": 1700,
    "detail": "25 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-wrist-fingers",
    "groupId": "arms",
    "label": "Zápěstí + prsty",
    "women": 700,
    "men": 950,
    "detail": "10 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-arms-full",
    "groupId": "arms",
    "label": "Celé ruce",
    "women": 1850,
    "men": 2500,
    "detail": "25 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-chest",
    "groupId": "body",
    "label": "Hrudník",
    "women": 1300,
    "men": 1800,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-areola",
    "groupId": "body",
    "label": "Okolo prsních dvorců",
    "women": 600,
    "men": null,
    "detail": "10 min",
    "sourceIds": [
      "device-women"
    ]
  },
  {
    "id": "device-abdomen",
    "groupId": "body",
    "label": "Břicho",
    "women": 1300,
    "men": 1800,
    "detail": "20 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-navel",
    "groupId": "body",
    "label": "Okolo pupíku",
    "women": 700,
    "men": null,
    "detail": "5 min",
    "sourceIds": [
      "device-women"
    ]
  },
  {
    "id": "device-below-navel",
    "groupId": "body",
    "label": "Střední linie pod pupíkem",
    "women": 700,
    "men": null,
    "detail": "5 min",
    "sourceIds": [
      "device-women"
    ]
  },
  {
    "id": "device-shoulders",
    "groupId": "body",
    "label": "Ramena",
    "women": null,
    "men": 1800,
    "detail": "15 min",
    "sourceIds": [
      "device-men"
    ]
  },
  {
    "id": "device-back-full",
    "groupId": "back",
    "label": "Celá záda",
    "women": 2200,
    "men": 3000,
    "detail": "35 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-back-half",
    "groupId": "back",
    "label": "½ zad (horní nebo dolní část)",
    "women": 1200,
    "men": null,
    "detail": "20 min",
    "sourceIds": [
      "device-women"
    ]
  },
  {
    "id": "device-back-upper",
    "groupId": "back",
    "label": "Horní část zad",
    "women": null,
    "men": 1800,
    "detail": "15 min",
    "sourceIds": [
      "device-men"
    ]
  },
  {
    "id": "device-back-lower",
    "groupId": "back",
    "label": "Dolní část zad",
    "women": null,
    "men": 1700,
    "detail": "15 min",
    "sourceIds": [
      "device-men"
    ]
  },
  {
    "id": "device-buttocks",
    "groupId": "intimate",
    "label": "Hýždě",
    "women": 1400,
    "men": 2000,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-between-buttocks",
    "groupId": "intimate",
    "label": "Mezi hýždě",
    "women": 800,
    "men": 1500,
    "detail": "10 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-groin",
    "groupId": "intimate",
    "label": "Třísla",
    "women": 1200,
    "men": 1800,
    "detail": "15 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-brazil",
    "groupId": "intimate",
    "label": "Brazílie — intimní partie",
    "women": 1800,
    "men": 2400,
    "detail": "30 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-calves",
    "groupId": "legs",
    "label": "Lýtka",
    "women": 1700,
    "men": 2200,
    "detail": "25 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-knees",
    "groupId": "legs",
    "label": "Kolena",
    "women": 600,
    "men": 600,
    "detail": "10 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-thighs",
    "groupId": "legs",
    "label": "Stehna",
    "women": 1800,
    "men": 2300,
    "detail": "25 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-legs-full",
    "groupId": "legs",
    "label": "Celé nohy",
    "women": 3000,
    "men": 4000,
    "detail": "40 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-instep-toes",
    "groupId": "legs",
    "label": "Nárt a prsty",
    "women": 750,
    "men": 1050,
    "detail": "10 min",
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  },
  {
    "id": "device-whole-body",
    "groupId": "body",
    "label": "Celé tělo",
    "women": 12500,
    "men": 15500,
    "sourceIds": [
      "device-women",
      "device-men"
    ]
  }
];

export const deviceHairRemovalPackages: GenderPriceRow[] = [
  {
    "id": "device-package-brazil-underarms-1",
    "label": "Brazilka + podpaží",
    "women": 2100,
    "men": 2800,
    "detail": "1 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-6",
    "label": "Brazilka + podpaží",
    "women": 11350,
    "men": 16790,
    "detail": "6 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-calves-1",
    "label": "Brazilka + podpaží + lýtka",
    "women": 3800,
    "men": 5050,
    "detail": "1 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-calves-6",
    "label": "Brazilka + podpaží + lýtka",
    "women": 20550,
    "men": 27300,
    "detail": "6 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-legs-1",
    "label": "Brazilka + podpaží + celé nohy",
    "women": 5100,
    "men": 6800,
    "detail": "1 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-legs-6",
    "label": "Brazilka + podpaží + celé nohy",
    "women": 27550,
    "men": 36720,
    "detail": "6 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-arms-legs-1",
    "label": "Brazilka + podpaží + celé ruce + celé nohy",
    "women": 6500,
    "men": 8900,
    "detail": "1 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  },
  {
    "id": "device-package-brazil-underarms-arms-legs-6",
    "label": "Brazilka + podpaží + celé ruce + celé nohy",
    "women": 35100,
    "men": 48100,
    "detail": "6 ošetření",
    "sourceIds": [
      "device-packages-women",
      "device-packages-men"
    ]
  }
];

export const priceCatalogs: PriceCatalog[] = [
  {
    id: 'depilation',
    mode: 'gender',
    title: 'Ceník depilace',
    description: 'Depilace jednotlivých partií, intimní péče a kombinace procedur.',
    notes: [],
    groups: [
      ...priceGroups.map(group => ({
        ...group,
        rows: depilationPrices.filter(row => row.groupId === group.id).map(row => ({ ...row, sourceIds: ['depilation-body'] })),
      })),
      ...[
        { id: 'intimate', title: 'Bikiny a intimní depilace' },
        { id: 'combinations', title: 'Kombinace a celé tělo' },
      ].map(group => ({ ...group, rows: additionalDepilationPrices.filter(row => row.groupId === group.id) })),
    ],
  },
  {
    id: 'massage',
    mode: 'single',
    title: 'Ceník masáží a zábalů',
    description: 'Jednotlivé masáže i balíčky. Délka a počet ošetření jsou uvedeny u příslušné varianty.',
    notes: [],
    groups: [
      { id: 'body', title: 'Regenerační a relaxační masáže' },
      { id: 'special', title: 'Speciální masáže' },
      { id: 'madero', title: getServiceTitle('massage-maderotherapy') },
      { id: 'relax', title: 'Relaxační a lymfodrenážné masáže' },
      { id: 'wraps', title: 'Zábaly' },
    ].map(group => ({ ...group, rows: massagePrices.filter(row => row.groupId === group.id) })),
  },
  {
    id: 'hair-removal',
    mode: 'gender',
    title: 'Ceník přístrojového odstranění chloupků',
    description: 'Ošetření jednotlivých partií a balíčky pro ženy i muže.',
    notes: [],
    groups: [
      ...[
        { id: 'face', title: 'Obličej a krk' },
        { id: 'arms', title: 'Ruce a podpaží' },
        { id: 'body', title: 'Trup a celé tělo' },
        { id: 'back', title: 'Záda' },
        { id: 'intimate', title: 'Intimní partie a hýždě' },
        { id: 'legs', title: 'Nohy' },
      ].map(group => ({ ...group, rows: deviceHairRemovalPrices.filter(row => row.groupId === group.id) })),
      { id: 'packages', title: 'Balíčky ošetření', rows: deviceHairRemovalPackages },
    ],
  },
  {
    id: 'brows-lashes',
    mode: 'single',
    title: 'Ceník péče o obočí a řasy',
    description: 'Úprava, barvení a laminace samostatně i v kombinaci.',
    notes: [],
    groups: [
      { id: 'brows', title: 'Obočí' },
      { id: 'lashes', title: 'Řasy' },
      { id: 'combined', title: 'Obočí a řasy společně' },
    ].map(group => ({ ...group, rows: browsLashesPrices.filter(row => row.groupId === group.id) })),
  },
];

export function formatPrice(value: PriceValue): string | null {
  if (value === null) return null;
  const fmt = new Intl.NumberFormat(site.locale, { maximumFractionDigits: 0 });
  if (typeof value === "number") return `${fmt.format(value)} ${content.common.currency}`;
  return `${fmt.format(value.from)}–${fmt.format(value.to)} ${content.common.currency}`;
}
