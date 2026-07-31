'use client';

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Menu, X, Clock, Sparkles } from 'lucide-react';

interface ClockState {
  time: string;
  date: string;
}

export const Navbar: React.FC<{ identityName: string; logoUrl: string }> = ({
  identityName,
  logoUrl,
}) => {
  const [clock, setClock] = useState<ClockState>({
    time: '12:00:00',
    date: 'Selasa, 28 Juli 2026',
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateLocalClock = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('id-ID', { hour12: false }),
        date: now.toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      });
    };
    updateLocalClock();
    const interval = setInterval(updateLocalClock, 1000);

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(socketUrl);
    socket.on('clock_sync', (data: { time: string; date: string }) => {
      if (data && data.time && data.date) {
        setClock({ time: data.time, date: data.date });
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      socket.disconnect();
    };
  }, []);

  const navLinks = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Program Kerja', href: '#program-kerja' },
    { label: 'Katalog Produk', href: '#katalog-produk' },
    { label: 'Pengurus', href: '#pengurus' },
    { label: 'Unit Usaha', href: '#unit-usaha' },
    { label: 'Berita', href: '#artikel' },
    { label: 'Kontak', href: '#footer' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-3xl transition-all duration-500 px-5 sm:px-7 py-3 sm:py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4 ${
          scrolled
            ? 'bg-white/85 backdrop-blur-2xl border border-white shadow-2xl shadow-emerald-950/10 scale-[0.99]'
            : 'bg-white/75 backdrop-blur-xl border border-white/90 shadow-xl shadow-emerald-950/5'
        }`}
      >
        {/* Brand Logo & Name with Emerald Subtitle */}
        <a href="#hero" className="flex items-center gap-3.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-600 flex items-center justify-center p-2 shadow-md group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
            <img
              src={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + (logoUrl || '/images/logo-bumdes.svg')}
              alt="Logo BUMDes"
              className="w-9 h-9 object-contain filter brightness-110"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-extrabold tracking-widest uppercase text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                BUMDes Banyubening
              </span>
            </div>
            <span className="block text-lg sm:text-xl font-black text-emerald-950 tracking-tight leading-tight mt-0.5">
              {identityName || 'Mata Air Gunung'}
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-100/80">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-emerald-900 hover:text-emerald-950 hover:bg-white hover:shadow-sm transition-all duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Re-designed Digital Clock "Tetesan Embun Pagi" (Jewel Glass Badge) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/90 border border-emerald-200/80 shadow-md group hover:shadow-xl transition-all duration-300">
          {/* Emerald Gradient Time Pill */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white font-mono font-black px-3.5 py-1.5 rounded-xl shadow-inner text-sm tracking-wider flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            <span>{clock.time}</span>
          </div>

          {/* Frosted Date Badge */}
          <div className="px-3.5 py-1 text-emerald-950 font-sans font-bold text-xs sm:text-sm tracking-tight">
            {clock.date}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-emerald-900 hover:bg-emerald-100/80 transition-colors ml-1"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-white/95 backdrop-blur-2xl border border-emerald-200/80 p-4 space-y-1.5 shadow-2xl animate-fadeIn">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-2xl text-base font-bold text-emerald-950 hover:bg-emerald-100/60 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
};
