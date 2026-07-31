'use client';

import React, { useState, useEffect } from 'react';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';

export interface PengurusItem {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
}

export const FloatingLeafCarousel: React.FC<{ items: PengurusItem[] }> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const list = items || [];
  const cardsPerPage = 3;
  const maxIndex = Math.max(0, list.length - cardsPerPage);

  useEffect(() => {
    if (isPaused || list.length <= cardsPerPage) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 2000);
    return () => clearInterval(timer);
  }, [isPaused, list.length, maxIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  return (
    <section id="pengurus" className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3 mb-16">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-700/15 text-emerald-800 border border-emerald-300/60 shadow-sm">
          Struktur Kepengurusan
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-emerald-950 tracking-tight">
          Pengurus BUMDes &bull; <span className="text-emerald-700 font-serif italic">&ldquo;The Floating Leaf&rdquo;</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base font-medium text-emerald-900/80">
          Susunan personel pengelola BUMDes Banyubening yang berdedikasi mengabdi untuk kemandirian ekonomi desa.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-3 border-dashed border-emerald-300/80 bg-white/70">
          <Users className="w-12 h-12 text-emerald-700/50 mx-auto mb-2" />
          <h3 className="font-extrabold text-lg text-emerald-950">
            Struktur Kepengurusan Belum Dipublikasikan
          </h3>
          <p className="text-sm text-emerald-900/75">
            Saat ini data pengurus sedang disiapkan dan akan segera diperbarui oleh Admin BUMDes melalui Dashboard.
          </p>
        </div>
      ) : (
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          {list.length > cardsPerPage && (
            <>
              <button
                onClick={handlePrev}
                className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 border border-emerald-200 shadow-xl text-emerald-950 hover:bg-emerald-700 hover:text-white transition-all duration-300"
                aria-label="Previous"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-white/90 border border-emerald-200 shadow-xl text-emerald-950 hover:bg-emerald-700 hover:text-white transition-all duration-300"
                aria-label="Next"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Carousel Viewport (Fotonya & Jabatannya Saja) */}
          <div className="overflow-hidden py-6 px-2">
            <div
              className="flex transition-transform duration-700 ease-out gap-8"
              style={{
                transform: `translateX(-${currentIndex * (100 / Math.min(cardsPerPage, list.length))}%)`,
              }}
            >
              {list.map((item) => {
                const photoUrl =
                  item.photoUrl && item.photoUrl.startsWith('/')
                    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + item.photoUrl
                    : item.photoUrl || '/images/default-avatar.svg';

                return (
                  <div
                    key={item.id}
                    className="w-full sm:w-1/2 md:w-1/3 shrink-0"
                  >
                    <div className="floating-leaf-card p-8 flex flex-col items-center text-center h-full">
                      {/* Circular Photo */}
                      <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-xl mb-6 group">
                        <img
                          src={photoUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/default-avatar.svg';
                          }}
                        />
                      </div>

                      {/* Name in bold dark green / black */}
                      <h3 className="text-xl font-black text-emerald-950 leading-snug tracking-tight">
                        {item.name}
                      </h3>

                      {/* Role / Jabatan in small caps, soft green */}
                      <span className="mt-2 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-700/15 text-emerald-800 border border-emerald-300/60 shadow-sm">
                        {item.role}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
