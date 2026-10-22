import { imageVariants } from '../data/imageVariants'

/** Keep the original src as fallback and let the browser choose the right WebP width. */
export function responsiveImage(src: string, sizes: string) {
  const variants = imageVariants[src]
  return variants ? { srcSet: variants.map(image => `${image.src} ${image.width}w`).join(', '), sizes } : {}
}
