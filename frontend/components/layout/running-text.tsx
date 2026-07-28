'use client';
import { useEffect, useState } from 'react';

interface RunningTextItem {
  id: string;
  text: string;
  emoji?: string;
}

export function RunningText({ items }: { items?: RunningTextItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !items || items.length === 0) return null;

  // Combine all texts with separator
  const combined = items.map(i => `${i.emoji || '📢'} ${i.text}`).join(' • • • ');

  return (
    <div className="running-text-container h-10 flex items-center relative z-40">
      <div className="running-text-content flex items-center gap-8 px-4">
        {/* Duplicate for seamless loop */}
        {[...Array(2)].map((_, idx) => (
          <span key={idx} className="text-white font-medium text-sm tracking-wide flex items-center gap-8">
            {items.map((item) => (
              <span key={`${idx}-${item.id}`} className="inline-flex items-center gap-2">
                <span className="text-lg">{item.emoji || '📢'}</span>
                <span className="drop-shadow-md">{item.text}</span>
                <span className="mx-4 opacity-60">•</span>
              </span>
            ))}
          </span>
        ))}
      </div>

      {/* Floating effect overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
    </div>
  );
}
