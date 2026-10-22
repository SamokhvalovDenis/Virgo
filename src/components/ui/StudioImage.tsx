import { useState } from 'react'
import { assetMetadata, assets, type AssetKey } from '../../data/assets'
import { responsiveImage } from '../../lib/responsiveImage'

export function StudioImage({ imageKey, alt, className = '', priority = false, sizes: requestedSizes }: { imageKey: AssetKey; alt: string; className?: string; priority?: boolean; sizes?: string }) {
  const src = assets[imageKey]
  const metadata = assetMetadata[imageKey]
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  if (!src || failedSrc === src) return null
  const sizes = requestedSizes ?? (imageKey === 'hero' ? '(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 60vw, 550px' : '(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) 45vw, 560px')
  return <img className={className} src={src} {...responsiveImage(src, sizes)} alt={alt} width={metadata?.width ?? 1200} height={metadata?.height ?? 900} style={metadata ? { objectPosition: metadata.objectPosition } : undefined} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailedSrc(src)} />
}
