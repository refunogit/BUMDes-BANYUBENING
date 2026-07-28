'use client';
import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface Pengurus {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  photoUrl?: string;
  bio?: string;
}

export function CarouselPengurus({ pengurus }: { pengurus: Pengurus[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Pengurus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 2 seconds, smooth no stutter
  useEffect(() => {
    if (pengurus.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % pengurus.length);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pengurus.length]);

  const translateX = `-${current * (100 / Math.min(4, pengurus.length))}%`;

  if (!pengurus || pengurus.length === 0) return null;

  return (
    <>
      <div className="w-full overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-ocean-800">Pengurus BUMDes</h2>
          <div className="flex gap-1">
            {pengurus.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${idx === current ? 'w-8 bg-ocean-500' : 'w-2 bg-ocean-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ocean-50 to-leaf-50 p-6">
          <div className="carousel-track flex gap-4" style={{ transform: `translateX(-${current * 260}px)` }}>
            {pengurus.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelected(p)}
                className="pengurus-frame flex-shrink-0 w-60 cursor-pointer hover:scale-105 transition-transform duration-300"
              >
                <div className="pengurus-card-inner p-0">
                  <div className="aspect-[4/3] bg-gradient-to-br from-ocean-100 to-ocean-200 relative overflow-hidden">
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                      <p className="text-white/80 text-xs">{p.roleLabel}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.roleLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gradient edges for smooth feeling */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-ocean-50 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-leaf-50 to-transparent pointer-events-none" />
        </div>

        <p className="text-xs text-center text-muted-foreground mt-3">Auto-slide 2 detik • Klik untuk detail • Frame 50% biru 50% merah</p>
      </div>

      {/* Modal on click - name + role */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="pengurus-frame">
              <div className="pengurus-card-inner">
                <div className="aspect-video bg-gradient-to-br from-ocean-500 to-ocean-700 relative">
                  {selected.photoUrl ? (
                    <img src={selected.photoUrl} alt={selected.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                  )}
                  <button onClick={() => setSelected(null)} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-ocean-800">{selected.name}</h3>
                  <p className="inline-block mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-ocean-500 to-red-500 text-white text-sm font-medium">
                    {selected.roleLabel}
                  </p>
                  {selected.bio && <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{selected.bio}</p>}
                  {!selected.bio && <p className="mt-4 text-sm text-muted-foreground">Pengurus BUMDes BANYUBENING dengan dedikasi untuk kemajuan desa.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
