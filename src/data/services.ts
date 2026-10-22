import type { AssetKey } from "./assets";
import type { ServiceCategoryId } from "./categories";

export type Service = {
  id: string;
  categoryId: ServiceCategoryId;
  title: string;
  shortDescription: string;
  image?: { key: AssetKey; alt: string };
  details: string[];
  isPublished: boolean;
  durationMinutes: number | null;
  /** Відповідний id priceList (не призначати без підтвердження власниці) */
  priceListId: string | null;
};

/**
 * На оригіналі перші 4 масажі йшли однією групою; розділити їх
 * на 4 продажні позиції можна лише після підтвердження власниці.
 * Короткі описи — редакційні чорновики, а не медичні обіцянки.
 */
export const services: Service[] = [
  {
    id: "massage-classic-group",
    image: { key: 'massage', alt: 'Masáž zad a ramen na masážním lehátku.' },
    categoryId: "massage",
    title: "Sportovní, klasická, regenerační a rekondiční masáž",
    shortDescription: "Různé techniky masáží podle vašich potřeb.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-honey",
    categoryId: "massage",
    title: "Medová a detoxikační masáž",
    shortDescription: "Speciální masážní technika s využitím medu.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-hot-stones",
    categoryId: "massage",
    title: "Masáž lávovými kameny",
    shortDescription: "Relaxace s využitím zahřátých kamenů.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-chocolate",
    categoryId: "massage",
    title: "Čokoládová masáž",
    shortDescription: "Odpočinková procedura s čokoládovou vůní.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-cupping",
    categoryId: "massage",
    title: "Baňkování",
    shortDescription: "Masážní ošetření pomocí baněk.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-anticellulite",
    categoryId: "massage",
    title: "Anticelulitidová masáž",
    shortDescription: "Masážní technika zaměřená na péči o pokožku.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-maderotherapy",
    categoryId: "massage",
    title: "Maderoterapie",
    shortDescription: "Masáž s použitím speciálních dřevěných pomůcek.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-ayurveda",
    categoryId: "massage",
    title: "Ájurvédská masáž",
    shortDescription: "Masáž inspirovaná tradičními indickými technikami.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-indian-head",
    categoryId: "massage",
    title: "Indická masáž hlavy",
    shortDescription: "Masáž zaměřená na oblast hlavy.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "massage-thai-feet",
    categoryId: "massage",
    title: "Thajská masáž nohou",
    shortDescription: "Masážní technika zaměřená na chodidla a nohy.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "depilation-sugaring",
    image: { key: 'depilation', alt: 'Depilační pasta na dřevěné špachtli nad miskou.' },
    categoryId: "depilation",
    title: "Depilace cukrovou pastou (sugaring)",
    shortDescription: "Odstraňování chloupků přírodní cukrovou pastou.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null, // Не прив'язувати наданий прайс без уточнення!
  },
  {
    id: "depilation-wax",
    categoryId: "depilation",
    title: "Vosková depilace",
    shortDescription: "Odstraňování chloupků pomocí vosku.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "depilation-vajacial",
    categoryId: "depilation",
    title: "Vajacial / manjacial",
    shortDescription: "Speciální kosmetické ošetření intimní oblasti.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "hair-removal-device",
    image: { key: 'hairRemoval', alt: 'Přístrojové ošetření nohou pro odstranění chloupků.' },
    categoryId: "hair-removal",
    title: "Trvalé odstranění chloupků",
    shortDescription: "Přístrojové ošetření pro odstranění chloupků.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "brows-lash-lifting",
    image: { key: 'browsLashes', alt: 'Detail oka a přirozených řas.' },
    categoryId: "brows-lashes",
    title: "Lash lifting",
    shortDescription: "Úprava vzhledu přírodních řas.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "brows-lamination",
    categoryId: "brows-lashes",
    title: "Laminace obočí",
    shortDescription: "Úprava a fixace tvaru obočí.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
  {
    id: "brows-color",
    categoryId: "brows-lashes",
    title: "Barvení obočí a řas",
    shortDescription: "Barvení pro zvýraznění obočí a řas.",
    details: [],
    isPublished: true,
    durationMinutes: null,
    priceListId: null,
  },
];
