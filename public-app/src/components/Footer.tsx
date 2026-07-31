'use client';

import React from 'react';
import { MapPin, Phone, Mail, Globe, Heart } from 'lucide-react';

export interface IdentityFooterProps {
  name: string;
  villageName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
}

export const Footer: React.FC<{ identity: IdentityFooterProps }> = ({ identity }) => {
  return (
    <footer id="footer" className="w-full bg-hijauPedesaan text-white border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1 border border-white/20">
                <img
                  src={(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + (identity.logoUrl || '/images/logo-bumdes.svg')}
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/favicon.ico';
                  }}
                />
              </div>
              <span className="text-xl font-bold tracking-tight">
                {identity.name || 'BUMDes Banyubening'}
              </span>
            </div>

            <p className="text-sm text-white/85 leading-relaxed max-w-md">
              Badan Usaha Milik Desa Banyubening berkomitmen mengelola kelestarian sumber mata air bening pegunungan dan pemberdayaan ekonomi seluruh warga desa.
            </p>

            <div className="pt-2 text-xs text-white/70">
              &copy; 2026 {identity.name || 'BUMDes Banyubening'}. Seluruh Hak Cipta Dilindungi Undang-Undang.
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-kuningBungaMatahari">
              Akses Cepat Desa
            </h4>
            <ul className="space-y-2 text-sm text-white/90">
              <li><a href="#hero" className="hover:text-kuningBungaMatahari transition-colors">Beranda</a></li>
              <li><a href="#program-kerja" className="hover:text-kuningBungaMatahari transition-colors">Program Kerja Desa</a></li>
              <li><a href="#katalog-produk" className="hover:text-kuningBungaMatahari transition-colors">Katalog Produk UMKM</a></li>
              <li><a href="#pengurus" className="hover:text-kuningBungaMatahari transition-colors">Struktur Pengurus</a></li>
              <li><a href="#unit-usaha" className="hover:text-kuningBungaMatahari transition-colors">Unit Usaha BUMDes</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-kuningBungaMatahari">
              Kontak & Layanan Warga
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/90">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-kuningBungaMatahari shrink-0 mt-0.5" />
                <span>{identity.address || 'Jl. Mata Air Bening No. 1, Desa Banyubening, Bejen, Temanggung'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-kuningBungaMatahari shrink-0" />
                <span>{identity.phone || '081234567890'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-kuningBungaMatahari shrink-0" />
                <span>{identity.email || 'info@bumdesbanyubening.id'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-kuningBungaMatahari shrink-0" />
                <span>bumdesbanyubening.plipir.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
          <div>
            Sistem Informasi BUMDes Banyubening &bull; Dibangun dengan Standar Arsitektur Enterprise
          </div>
          <div className="flex items-center gap-1">
            <span>Didedikasikan untuk kesejahteraan masyarakat dengan</span>
            <Heart className="w-3.5 h-3.5 text-merahJambu fill-merahJambu" />
            <span>oleh Tim Desa Banyubening</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
