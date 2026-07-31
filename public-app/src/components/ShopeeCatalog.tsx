'use client';

import React, { useState } from 'react';
import {
  Search,
  Star,
  ShoppingBag,
  X,
  CheckCircle,
  Tag,
  Package,
} from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  stock: number;
  description: string;
  coverImage: string;
  galleryImages: string[];
  unitName: string;
  rating: number;
  soldCount: number;
}

export const ShopeeCatalog: React.FC<{ products: ProductItem[] }> = ({
  products,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  const list = products || [];

  const categories = ['SEMUA', ...Array.from(new Set(list.map((p) => p.category)))];

  const filteredProducts = list.filter((p) => {
    const matchCat = selectedCategory === 'SEMUA' || p.category === selectedCategory;
    const matchQuery =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="katalog-produk" className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title & Description */}
      <div className="text-center space-y-3 mb-10">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-hijauPedesaan/15 text-hijauPedesaan">
          Katalog Produk Desa & UMKM
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-hijauPedesaanTua">
          Katalog Produk &bull; <span className="text-hijauPedesaan">BUMDes Banyubening</span>
        </h2>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-hijauPedesaanTua/80">
          Etalase publik produk berkualitas hasil usaha BUMDes dan UMKM Banyubening dengan informasi harga dan ketersediaan stok yang transparan.
        </p>
      </div>

      {/* Search Input and Category Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                selectedCategory === cat
                  ? 'bg-hijauPedesaan text-white shadow-md scale-105'
                  : 'bg-white/80 text-hijauPedesaanTua border border-hijauPedesaan/20 hover:bg-hijauPedesaan/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari produk BUMDes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/90 border border-hijauPedesaan/30 text-sm text-hijauPedesaanTua placeholder-hijauPedesaan/60 focus:outline-none focus:ring-2 focus:ring-hijauPedesaan shadow-sm"
          />
          <Search className="w-5 h-5 text-hijauPedesaan/70 absolute left-3 top-3" />
        </div>
      </div>

      {/* Product Showcase Grid (Gambar, Nama, Harga, Stok) */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-2xl mx-auto space-y-3 border-dashed border-emerald-300/80 bg-white/70">
          <ShoppingBag className="w-12 h-12 text-emerald-700/50 mx-auto mb-2" />
          <h3 className="font-extrabold text-lg text-emerald-950">
            Katalog Produk Belum Tersedia
          </h3>
          <p className="text-sm text-emerald-900/75">
            Belum ada katalog produk yang dipublikasikan oleh Admin BUMDes atau cocok dengan pencarian Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((p) => {
            const coverUrl =
              p.coverImage && p.coverImage.startsWith('/')
                ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + p.coverImage
                : p.coverImage || '/images/product-amdk.svg';

            return (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
                  setActiveImageIndex(0);
                }}
                className="glass-card hover:scale-[1.03] transition-all duration-300 overflow-hidden flex flex-col cursor-pointer group"
              >
                {/* Gambar Produk */}
                <div className="relative w-full h-44 sm:h-52 bg-airBeningGunung overflow-hidden">
                  <img
                    src={coverUrl}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/product-amdk.svg';
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-hijauPedesaan text-white text-[10px] font-bold uppercase tracking-wider shadow">
                    {p.category}
                  </div>
                  {p.stock > 0 ? (
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-white/95 text-hijauPedesaan text-xs font-extrabold shadow-sm flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>Stok: {p.stock}</span>
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-merahJambu text-white text-[10px] font-bold shadow-sm">
                      Stok Habis
                    </div>
                  )}
                </div>

                {/* Nama Produk, Harga, dan Stok */}
                <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-hijauPedesaanTua line-clamp-2 group-hover:text-hijauPedesaan transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-hijauPedesaan/10">
                    <div className="text-sm sm:text-base font-extrabold text-hijauPedesaan">
                      {formatRupiah(p.price)}
                      <span className="text-[10px] font-normal text-hijauPedesaanTua/70 ml-1">
                        /{p.unitName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-hijauPedesaanTua/80 font-semibold">
                      <div className="flex items-center gap-1 text-kuningBungaMatahari font-bold">
                        <Star className="w-3.5 h-3.5 fill-kuningBungaMatahari" />
                        <span className="text-hijauPedesaanTua">{p.rating}</span>
                      </div>
                      <span className="text-hijauPedesaan font-bold">Stok: {p.stock} {p.unitName}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail Produk (Gambar, Nama Produk, Harga, Stok) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-modal max-w-3xl w-full overflow-hidden relative grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-hijauPedesaanTua transition-colors shadow"
              aria-label="Tutup Detail"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Image Gallery (Gambar Produk) */}
            <div className="p-6 bg-airBeningGunung flex flex-col justify-between space-y-4">
              <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                <img
                  src={
                    (selectedProduct.galleryImages && selectedProduct.galleryImages[activeImageIndex]
                      ? selectedProduct.galleryImages[activeImageIndex].startsWith('/')
                        ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') +
                          selectedProduct.galleryImages[activeImageIndex]
                        : selectedProduct.galleryImages[activeImageIndex]
                      : selectedProduct.coverImage && selectedProduct.coverImage.startsWith('/')
                      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') +
                        selectedProduct.coverImage
                      : selectedProduct.coverImage || '/images/product-amdk.svg')
                  }
                  alt={selectedProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Thumbnails */}
              {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedProduct.galleryImages.map((img, index) => {
                    const thumbUrl = img.startsWith('/')
                      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + img
                      : img;
                    return (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activeImageIndex === index
                            ? 'border-hijauPedesaan scale-105 shadow'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={thumbUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Nama Produk, Harga, Stok, dan Deskripsi */}
            <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-hijauPedesaan/10 text-hijauPedesaan text-xs font-bold uppercase">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{selectedProduct.category}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-hijauPedesaanTua leading-snug">
                  {selectedProduct.name}
                </h3>

                <div className="flex items-center gap-4 border-y border-hijauPedesaan/15 py-3">
                  <div className="text-2xl font-extrabold text-hijauPedesaan">
                    {formatRupiah(selectedProduct.price)}
                    <span className="text-xs font-normal text-hijauPedesaanTua/70 ml-1">
                      /{selectedProduct.unitName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-airBeningGunung text-hijauPedesaan font-bold text-sm">
                    <Package className="w-4 h-4" />
                    <span>Stok: {selectedProduct.stock} {selectedProduct.unitName}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-hijauPedesaanTua/70 mb-2">
                    Deskripsi Produk
                  </h4>
                  <p className="text-sm text-hijauPedesaanTua/90 leading-relaxed">
                    {selectedProduct.description}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-hijauPedesaan/10 border border-hijauPedesaan/20 flex items-center gap-3 text-xs font-semibold text-hijauPedesaan">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>
                    Katalog informasi produk BUMDes Banyubening. Untuk pemesanan dalam jumlah besar atau kerja sama, silakan hubungi kontak resmi desa.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedProduct(null)}
                className="w-full py-3 rounded-xl bg-hijauPedesaan text-white font-bold text-sm shadow hover:bg-hijauPedesaanTua transition-colors"
              >
                Tutup Detail Produk
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
