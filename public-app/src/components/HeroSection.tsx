'use client';

import React from 'react';
import { ArrowRight, Droplets, TrendingUp, Users, Award, ShieldCheck, Sparkles } from 'lucide-react';

export interface IdentityProps {
  name: string;
  villageName: string;
  description: string;
  heroBackgroundUrl: string;
}

export const HeroSection: React.FC<{ identity: IdentityProps }> = ({ identity }) => {
  const bgUrl =
    (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') +
    (identity.heroBackgroundUrl || '/images/hero-mountain-spring.jpg');

  return (
    <section id="hero" className="relative w-full min-h-[660px] flex items-center justify-center overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      {/* Background Image with warm morning dew overlay */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 filter brightness-95 scale-105"
        style={{
          backgroundImage: `url('${bgUrl}')`,
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-emerald-950/80 via-emerald-900/65 to-[#F4F9F5]" />

      {/* Hero Main Viewport */}
      <div className="relative z-20 max-w-7xl mx-auto text-center text-white space-y-10">
        {/* Luxury Glass Pill Banner */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 text-xs sm:text-sm font-extrabold tracking-wide uppercase shadow-lg">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Mata Air Bening Gunung &bull; Kemandirian Ekonomi Desa</span>
        </div>

        {/* Brand Main Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight drop-shadow-lg leading-tight font-sans">
            {identity.name || 'BUMDes Banyubening'}
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl font-medium text-white/95 leading-relaxed drop-shadow">
            {identity.description ||
              'Badan Usaha Milik Desa Banyubening - Mewujudkan Kemandirian Ekonomi Desa melalui Pengelolaan Mata Air Gunung yang Bersih dan Potensi Usaha Berkelanjutan.'}
          </p>
        </div>

        {/* CTA Glassmorphism Action Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#program-kerja"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 text-emerald-950 font-black text-base shadow-2xl hover:scale-105 hover:from-amber-300 hover:to-yellow-200 transition-all duration-300 flex items-center gap-2.5"
          >
            <span>Jelajahi Program Kerja</span>
            <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#katalog-produk"
            className="px-8 py-4 rounded-2xl bg-white/25 backdrop-blur-2xl text-white font-extrabold text-base border border-white/60 shadow-xl hover:bg-white/35 hover:scale-105 transition-all duration-300"
          >
            Katalog Produk BUMDes
          </a>
        </div>

        {/* Jewel-Crafted Statistics Glassmorphism Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 max-w-5xl mx-auto">
          <div className="bg-white/85 backdrop-blur-2xl border border-white rounded-3xl p-6 text-center text-emerald-950 shadow-2xl hover:bg-white hover:-translate-y-2 hover:shadow-emerald-950/20 hover:border-emerald-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-emerald-800" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">18.5%</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-800/80 mt-1">
              Pertumbuhan Laba 2026
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-2xl border border-white rounded-3xl p-6 text-center text-emerald-950 shadow-2xl hover:bg-white hover:-translate-y-2 hover:shadow-emerald-950/20 hover:border-emerald-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Droplets className="w-6 h-6 text-teal-800" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">4 Unit</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-800/80 mt-1">
              Usaha Desa Berkelanjutan
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-2xl border border-white rounded-3xl p-6 text-center text-emerald-950 shadow-2xl hover:bg-white hover:-translate-y-2 hover:shadow-emerald-950/20 hover:border-emerald-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-800" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">1.200+</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-800/80 mt-1">
              Kepala Keluarga Terdampak
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-2xl border border-white rounded-3xl p-6 text-center text-emerald-950 shadow-2xl hover:bg-white hover:-translate-y-2 hover:shadow-emerald-950/20 hover:border-emerald-300 transition-all duration-300 group">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6 text-amber-700" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-950">100%</div>
            <div className="text-xs sm:text-sm font-bold text-emerald-800/80 mt-1">
              Transparansi Keuangan
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
