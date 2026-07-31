'use client';

import React from 'react';
import { MapPin, Navigation, Clock, Phone, Mail } from 'lucide-react';

export interface MapsSectionProps {
  name?: string;
  villageName?: string;
  address?: string;
  phone?: string;
  email?: string;
  mapsEmbedUrl?: string | null;
}

export const MapsSection: React.FC<{ identity: MapsSectionProps }> = ({ identity }) => {
  const mapsUrl = identity.mapsEmbedUrl?.trim();

  return (
    <section id="peta-lokasi" className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center space-y-3 mb-16">
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-700/15 text-emerald-800 border border-emerald-300/60 shadow-sm">
          Akses Lokasi Resmi
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-emerald-950 tracking-tight">
          Peta Lokasi &bull; <span className="text-emerald-700 font-serif italic">Banyubening</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base font-medium text-emerald-900/80">
          Kunjungi kantor pusat administrasi BUMDes serta kawasan ekowisata dan pemandian mata air alami Banyubening.
        </p>
      </div>

      <div className="glass-card p-6 sm:p-10 shadow-2xl border border-white/90">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column: Address & Operational Metadata */}
          <div className="lg:col-span-1 flex flex-col justify-between space-y-6 bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-emerald-200/70 shadow-sm">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-700/15 text-emerald-800 font-bold text-xs uppercase">
                <Navigation className="w-4 h-4" />
                <span>Pusat Layanan Warga</span>
              </div>

              <h3 className="text-2xl font-black text-emerald-950 leading-snug">
                {identity.name || 'BUMDes Banyubening'}
              </h3>

              <div className="space-y-3 pt-2 border-t border-emerald-200/50 text-xs sm:text-sm text-emerald-950/90 font-medium">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    {identity.address ||
                      'Jl. Mata Air Bening No. 1, Desa Banyubening, Bejen, Temanggung, Jawa Tengah'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>Senin - Sabtu: 08:00 - 16:00 WIB</span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>{identity.phone || '081234567890'}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>{identity.email || 'info@bumdesbanyubening.id'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-200/50">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Wilayah Administrasi
              </div>
              <div className="text-sm font-extrabold text-emerald-950">
                {identity.villageName || 'Desa Banyubening, Bejen, Temanggung'}
              </div>
            </div>
          </div>

          {/* Right Column: Google Maps Interactive Viewport */}
          <div className="lg:col-span-2 rounded-3xl overflow-hidden border-2 border-white/90 bg-white/50 shadow-inner min-h-[380px] flex items-center justify-center relative">
            {mapsUrl ? (
              <iframe
                src={mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '400px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Peta Lokasi BUMDes Banyubening"
                className="w-full h-full min-h-[400px]"
              />
            ) : (
              <div className="p-10 text-center max-w-md mx-auto space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-inner">
                  <MapPin className="w-8 h-8 text-emerald-700" />
                </div>
                <h4 className="font-extrabold text-lg text-emerald-950">
                  Peta Lokasi BUMDes Belum Ditambahkan
                </h4>
                <p className="text-sm text-emerald-900/75">
                  URL Embed Google Maps resmi BUMDes Banyubening sedang dipersiapkan dan akan segera diunggah oleh Admin melalui Dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
