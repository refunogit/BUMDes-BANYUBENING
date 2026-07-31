'use client';

import React, { useState } from 'react';
import { Newspaper, Calendar, Eye, X, ArrowRight } from 'lucide-react';

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  publishedAt: string;
  author: string;
  views: number;
}

export const ArticlesSection: React.FC<{ articles: ArticleItem[] }> = ({ articles }) => {
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  const list = articles || [];

  return (
    <section id="artikel" className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center space-y-3 mb-12">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-hijauPedesaan/15 text-hijauPedesaan">
          Kabar & Transparansi
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-hijauPedesaanTua">
          Berita &bull; <span className="text-hijauPedesaan">Banyubening Terkini</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-hijauPedesaanTua/80">
          Informasi transparan, kegiatan pelatihan warga, dan pencapaian terbaru BUMDes Banyubening.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-3 border-dashed border-emerald-300/80 bg-white/70">
          <Newspaper className="w-12 h-12 text-emerald-700/50 mx-auto mb-2" />
          <h3 className="font-extrabold text-lg text-emerald-950">
            Berita & Publikasi Belum Tersedia
          </h3>
          <p className="text-sm text-emerald-900/75">
            Saat ini artikel berita sedang dipersiapkan dan akan segera diperbarui oleh Admin BUMDes.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {list.map((art) => {
          const coverUrl =
            art.coverImage && art.coverImage.startsWith('/')
              ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + art.coverImage
              : art.coverImage || '/images/hero-mountain-spring.jpg';

          const dateStr = new Date(art.publishedAt || Date.now()).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });

          return (
            <div
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="glass-card hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group"
            >
              <div className="relative w-full h-48 overflow-hidden">
                <img
                  src={coverUrl}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-hijauPedesaan text-white text-[10px] font-bold uppercase tracking-wider">
                  {art.category}
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-hijauPedesaanTua/70">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-hijauPedesaan" />
                      {dateStr}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-hijauPedesaan" />
                      {art.views} Dilihat
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-hijauPedesaanTua group-hover:text-hijauPedesaan transition-colors line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-sm text-hijauPedesaanTua/80 line-clamp-3">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-2 text-xs font-semibold text-hijauPedesaan inline-flex items-center gap-1">
                  <span>Baca Selengkapnya</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal max-w-3xl w-full p-6 sm:p-8 relative space-y-6 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-hijauPedesaanTua transition-colors shadow"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-hijauPedesaan/10 text-hijauPedesaan text-xs font-bold uppercase">
                {selectedArticle.category}
              </span>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-hijauPedesaanTua leading-snug">
                {selectedArticle.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-hijauPedesaanTua/70 border-b border-hijauPedesaan/15 pb-3">
                <span>Oleh: {selectedArticle.author}</span>
                <span>&bull;</span>
                <span>
                  {new Date(selectedArticle.publishedAt || Date.now()).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="prose max-w-none text-base text-hijauPedesaanTua/90 leading-relaxed whitespace-pre-line">
              {selectedArticle.content}
            </div>

            <button
              onClick={() => setSelectedArticle(null)}
              className="w-full py-3 rounded-xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
            >
              Tutup Berita
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
