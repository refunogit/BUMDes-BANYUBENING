'use client';

import React, { useState } from 'react';
import { Building2, UserCheck, Phone, X, ArrowRight } from 'lucide-react';

export interface UnitItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  manager: string;
  contact: string;
  contentBlocks: Array<{ type: string; content: string }>;
}

export const UnitUsahaSection: React.FC<{ units: UnitItem[] }> = ({ units }) => {
  const [selectedUnit, setSelectedUnit] = useState<UnitItem | null>(null);

  const list = units || [];

  return (
    <section id="unit-usaha" className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3 mb-12">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-hijauPedesaan/15 text-hijauPedesaan">
          Pilar Mandiri Desa
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-hijauPedesaanTua">
          Unit Usaha &bull; <span className="text-hijauPedesaan">BUMDes Banyubening</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-hijauPedesaanTua/80">
          Empat sektor usaha strategis yang bersinergi dalam pemanfaatan potensi mata air bening dan pertanian pedesaan.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-3 border-dashed border-emerald-300/80 bg-white/70">
          <Building2 className="w-12 h-12 text-emerald-700/50 mx-auto mb-2" />
          <h3 className="font-extrabold text-lg text-emerald-950">
            Unit Usaha Belum Dipublikasikan
          </h3>
          <p className="text-sm text-emerald-900/75">
            Saat ini unit usaha BUMDes sedang dipersiapkan dan akan segera diunggah oleh Admin melalui Dashboard.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {list.map((unit) => {
          const coverUrl =
            unit.coverImage && unit.coverImage.startsWith('/')
              ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + unit.coverImage
              : unit.coverImage || '/images/hero-mountain-spring.jpg';

          return (
            <div
              key={unit.id}
              className="glass-card p-6 sm:p-8 flex flex-col justify-between shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-white"
            >
              <div className="space-y-4">
                <div className="w-full h-48 rounded-2xl overflow-hidden bg-white shadow-inner">
                  <img
                    src={coverUrl}
                    alt={unit.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-hijauPedesaan">
                  <Building2 className="w-4 h-4" />
                  <span>Unit Usaha Resmi BUMDes</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-hijauPedesaanTua">
                  {unit.name}
                </h3>

                <p className="text-sm text-hijauPedesaanTua/85 leading-relaxed">
                  {unit.description}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-hijauPedesaanTua/80 pt-2 border-t border-hijauPedesaan/15">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-hijauPedesaan" />
                    <span>Kepala Unit: {unit.manager}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-hijauPedesaan" />
                    <span>{unit.contact}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUnit(unit)}
                className="mt-6 w-full py-2.5 rounded-xl bg-white text-hijauPedesaanTua font-bold text-sm border border-hijauPedesaan/30 hover:bg-hijauPedesaan hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>Lihat Profil & Layanan Unit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
      )}

      {/* Detail Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal max-w-2xl w-full p-6 sm:p-8 relative space-y-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUnit(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-hijauPedesaanTua transition-colors shadow"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-hijauPedesaanTua">
              {selectedUnit.name}
            </h3>

            <p className="text-base text-hijauPedesaanTua/90 leading-relaxed">
              {selectedUnit.description}
            </p>

            {selectedUnit.contentBlocks && selectedUnit.contentBlocks.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-hijauPedesaan/20">
                <h4 className="text-sm font-bold uppercase tracking-wider text-hijauPedesaan">
                  Layanan & Pengembangan Usaha
                </h4>
                {selectedUnit.contentBlocks.map((b, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-white/90 border border-hijauPedesaan/20 text-sm text-hijauPedesaanTua">
                    {b.content}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-hijauPedesaan/10 border border-hijauPedesaan/20 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Kepala Pengelola</div>
                <div className="font-bold text-hijauPedesaanTua">{selectedUnit.manager}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-hijauPedesaanTua/70">Kontak Layanan</div>
                <div className="font-bold text-hijauPedesaanTua">{selectedUnit.contact}</div>
              </div>
            </div>

            <button
              onClick={() => setSelectedUnit(null)}
              className="w-full py-3 rounded-xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
