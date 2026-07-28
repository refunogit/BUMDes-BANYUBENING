'use client';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function DigitalClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="h-16 bg-gradient-to-r from-ocean-50 to-leaf-50 animate-pulse rounded-lg" />
    );
  }

  const dayName = format(now, 'EEEE', { locale: id });
  const fullDate = format(now, 'dd MMMM yyyy', { locale: id });
  const time = format(now, 'HH:mm:ss');

  return (
    <div className="bg-gradient-to-br from-white to-ocean-50 border border-ocean-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white">
          🕐
        </div>
        <div>
          <p className="font-semibold text-ocean-800 capitalize">{dayName}, {fullDate}</p>
          <p className="text-xs text-muted-foreground">Waktu Desa Banyubening - Real-time</p>
        </div>
      </div>
      <div className="digital-clock text-2xl font-bold font-mono bg-white px-4 py-2 rounded-lg border shadow-inner">
        {time} WIB
      </div>
    </div>
  );
}
