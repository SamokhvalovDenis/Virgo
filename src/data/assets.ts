/** Local selected photographs; null entries retain their existing decorative fallback. */
export const assets = {
  logo: null,
  hero: '/images/about/gallery/virgo-5e46a6a8e504.jpg',
  massage: '/images/services/massage.jpg',
  depilation: '/images/services/depilation.jpg',
  hairRemoval: '/images/services/hair-removal.jpg',
  browsLashes: '/images/services/brows-lashes.jpg',
  studio01: '/images/about/studio-main.jpg',
  studio02: null,
  studio03: null,
  giftCard: '/images/gifts/gift-certificates.jpg',
} as const satisfies Record<string, string | null>;

export type AssetKey = keyof typeof assets;
type AssetMetadata = { width: number; height: number; objectPosition: string; sourceFile: string };

/** Original downloads are preserved. Dimensions and crop focus match the selected files. */
export const assetMetadata: Partial<Record<AssetKey, AssetMetadata>> = {
  hero: { width: 1280, height: 960, objectPosition: '50% 50%', sourceFile: 'virgo-5e46a6a8e504.jpg' },
  massage: { width: 600, height: 300, objectPosition: '50% 50%', sourceFile: 'virgo-57e4e1920ab5.jpg' },
  depilation: { width: 600, height: 300, objectPosition: '50% 50%', sourceFile: 'virgo-0f0fb8661ddc.jpg' },
  hairRemoval: { width: 768, height: 1024, objectPosition: '50% 58%', sourceFile: 'virgo-d88cd29c2203.jpg' },
  browsLashes: { width: 1079, height: 811, objectPosition: '50% 50%', sourceFile: 'virgo-83c0aab8a97a.jpg' },
  studio01: { width: 370, height: 278, objectPosition: '50% 50%', sourceFile: 'virgo-05beda091c66.jpg' },
  giftCard: { width: 1280, height: 640, objectPosition: '50% 50%', sourceFile: 'virgo-494307ff0210.jpg' },
};

export type GalleryImage = {
  id: string;
  src: string;
  fullSrc?: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
};

/** The six distinct studio photos, verified against the original site's O nás gallery.
 * WebP previews retain the whole source; fullSrc points to the unmodified original.
 * Source URLs, dimensions and file sizes: reports/about-gallery/source-images.json.
 */
export const aboutGallery: readonly GalleryImage[] = [
  {
    id: 'studio-overview',
    src: '/images/about/gallery/virgo-941bef5d4e2b.webp',
    fullSrc: '/images/about/gallery/virgo-941bef5d4e2b.jpg',
    alt: 'Celkový pohled do studia Virgo s kosmetickým lehátkem a vybavením',
    width: 1280, height: 960,
  },
  {
    id: 'waiting-area',
    src: '/images/about/gallery/virgo-5e46a6a8e504.webp',
    fullSrc: '/images/about/gallery/virgo-5e46a6a8e504.jpg',
    alt: 'Čekací koutek se dvěma křesly a kulatým stolkem',
    width: 1280, height: 960, objectPosition: '50% 65%',
  },
  {
    id: 'reception',
    src: '/images/about/gallery/virgo-b3ac8b382ca3.webp',
    fullSrc: '/images/about/gallery/virgo-b3ac8b382ca3.png',
    alt: 'Recepce studia s diplomy a certifikáty na stěně',
    width: 960, height: 1280, objectPosition: '50% 28%',
  },
  {
    id: 'massage-room',
    src: '/images/about/gallery/virgo-05beda091c66.webp',
    fullSrc: '/images/about/gallery/virgo-05beda091c66.jpg',
    alt: 'Masážní lehátko v klidném a světlém prostoru studia',
    width: 1280, height: 960,
  },
  {
    id: 'candle-detail',
    src: '/images/about/gallery/virgo-f04a78ef8962.webp',
    fullSrc: '/images/about/gallery/virgo-f04a78ef8962.jpg',
    alt: 'Zapálené dekorativní svíčky na poličce ve studiu',
    width: 1280, height: 960, objectPosition: '50% 60%',
  },
  {
    id: 'studio-equipment',
    src: '/images/about/gallery/virgo-945bb0014d8e.webp',
    fullSrc: '/images/about/gallery/virgo-945bb0014d8e.jpg',
    alt: 'Kosmetické vybavení a bílé úložné skříně ve studiu Virgo',
    width: 1280, height: 780,
  },
];
