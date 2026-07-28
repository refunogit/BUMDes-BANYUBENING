'use client';
import { useState } from 'react';

export function ProductGallery({ images, name }: { images: any[]; name: string }) {
  const [active, setActive] = useState(0);

  const imgs = images && images.length > 0 ? images : [{ url: '/placeholder-product.jpg' }];

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border">
        <img src={imgs[active]?.url} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {imgs.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActive(idx)}
            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${idx === active ? 'border-ocean-500 ring-2 ring-ocean-200' : 'border-transparent hover:border-ocean-200'}`}
          >
            <img src={img.url} alt={`${name}-${idx}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
