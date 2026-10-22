import { useState } from 'react'
import { serviceDetailUi } from '../../data/serviceDetails'
import type { ServiceDetail } from '../../data/serviceDetails'
import { responsiveImage } from '../../lib/responsiveImage'

function DetailPhoto({ image, priority }: { image: ServiceDetail['image']; priority: boolean }) {
  const [failed, setFailed] = useState(false)
  return <figure className="service-detail-photo">
    {failed ? <p className="service-detail-photo-missing">{serviceDetailUi.missingImage}</p> :
      <img src={image.src} {...responsiveImage(image.src, '(max-width: 760px) calc(100vw - 40px), 560px')} alt={image.alt} width={image.width} height={image.height} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailed(true)} />}
  </figure>
}

export function ServiceDetailBlocks({ blocks }: { blocks: ServiceDetail[] }) {
  return <div className="service-detail-blocks">{blocks.map((block, index) =>
    <section key={block.id} id={block.id} className={`service-detail-block${index % 2 ? ' service-detail-block-reversed' : ''}`} aria-labelledby={`${block.id}-title`}>
      <DetailPhoto image={block.image} priority={index === 0} />
      <div className="service-detail-copy">
        <h2 id={`${block.id}-title`}>{block.title}</h2>
        {block.content.map((part, partIndex) => part.type === 'paragraph' ?
          <p key={partIndex}>{part.text}</p> :
          <ul key={partIndex}>{part.items.map(item => <li key={item.text}>{item.text}</li>)}</ul>)}
      </div>
    </section>)}
  </div>
}
