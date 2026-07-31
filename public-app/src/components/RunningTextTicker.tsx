'use client';

import React, { useState } from 'react';
import { Sparkles, Radio } from 'lucide-react';

export interface TickerItem {
  id: string;
  text: string;
  category: 'FINANCIAL' | 'TRAINING' | 'BUSINESS' | 'GENERAL';
  emoji: string;
}

export const RunningTextTicker: React.FC<{ items: TickerItem[] }> = ({ items }) => {
  const [isHovered, setIsHovered] = useState(false);

  const displayItems =
    items && items.length > 0
      ? items
      : [
          {
            id: 'default-1',
            text: '🟢 Selamat datang di Gerbang Informasi Resmi BUMDes Banyubening.',
            category: 'GENERAL' as const,
            emoji: '🟢',
          },
        ];

  return (
    <section id="running-text" className="w-full px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
      <div
        className={`glass-card p-3 sm:p-4 flex items-center gap-4 transition-all duration-300 ${
          isHovered
            ? 'shadow-2xl border-emerald-400/80 bg-white/95 -translate-y-0.5'
            : 'shadow-lg border-emerald-200/60 bg-white/80'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        {/* Luxury Broadcast Pill Badge */}
        <div className="flex items-center shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
            </span>
            <span className="hidden sm:inline">Kabar Desa</span>
            <span className="sm:hidden">Info</span>
          </div>
        </div>

        {/* Marquee Viewport with Genuine Dew Fade-Out Edges */}
        <div className="overflow-hidden whitespace-nowrap w-full fade-edges">
          <div
            className={`inline-flex items-center gap-14 ${
              isHovered
                ? 'font-bold text-emerald-950 tracking-normal'
                : 'font-semibold text-emerald-900/90'
            } animate-marquee`}
          >
            {displayItems.concat(displayItems).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2.5 cursor-pointer group"
              >
                <span
                  className="text-lg select-none group-hover:scale-125 transition-transform"
                  role="img"
                  aria-label="category"
                >
                  {item.emoji}
                </span>
                <span className="text-sm sm:text-base tracking-tight text-emerald-950/95 group-hover:text-emerald-700 transition-colors">
                  {item.text.replace(/^[🟢🟡🔵🇮🇩🌙🏮🎄🎆]\s*/, '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
