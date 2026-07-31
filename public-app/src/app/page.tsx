'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Navbar } from '@/components/Navbar';
import { RunningTextTicker, TickerItem } from '@/components/RunningTextTicker';
import { HeroSection, IdentityProps } from '@/components/HeroSection';
import { FloatingLeafCarousel, PengurusItem } from '@/components/FloatingLeafCarousel';
import { ProgramKerjaShowcase, ProgramKerjaItem } from '@/components/ProgramKerjaShowcase';
import { ShopeeCatalog, ProductItem } from '@/components/ShopeeCatalog';
import { UnitUsahaSection, UnitItem } from '@/components/UnitUsahaSection';
import { ArticlesSection, ArticleItem } from '@/components/ArticlesSection';
import { MapsSection } from '@/components/MapsSection';
import { WhatsAppChatWidget } from '@/components/WhatsAppChatWidget';
import { Footer, IdentityFooterProps } from '@/components/Footer';

export default function PublicPage() {
  const [identity, setIdentity] = useState<IdentityProps & IdentityFooterProps>({
    name: 'BUMDes Banyubening',
    villageName: 'Desa Banyubening, Bejen, Temanggung',
    description:
      'Badan Usaha Milik Desa Banyubening - Mewujudkan Kemandirian Ekonomi Desa melalui Pengelolaan Mata Air Gunung yang Bersih dan Potensi Usaha Berkelanjutan.',
    heroBackgroundUrl: '/images/hero-mountain-spring.jpg',
    address: 'Jl. Mata Air Bening No. 1, Desa Banyubening, Bejen, Temanggung, Jawa Tengah',
    phone: '081234567890',
    email: 'info@bumdesbanyubening.id',
    logoUrl: '/images/logo-bumdes.svg',
  });

  const [tickers, setTickers] = useState<TickerItem[]>([]);
  const [pengurus, setPengurus] = useState<PengurusItem[]>([]);
  const [programs, setPrograms] = useState<ProgramKerjaItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [units, setUnits] = useState<UnitItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchAllContent = useCallback(async () => {
    try {
      const [idRes, rtRes, pengRes, progRes, prodRes, unitRes, artRes] = await Promise.all([
        axios.get(`${apiUrl}/api/identity`).catch(() => null),
        axios.get(`${apiUrl}/api/running-text`).catch(() => null),
        axios.get(`${apiUrl}/api/pengurus`).catch(() => null),
        axios.get(`${apiUrl}/api/program-kerja`).catch(() => null),
        axios.get(`${apiUrl}/api/products`).catch(() => null),
        axios.get(`${apiUrl}/api/unit-usaha`).catch(() => null),
        axios.get(`${apiUrl}/api/articles`).catch(() => null),
      ]);

      if (idRes?.data?.data) setIdentity(idRes.data.data);
      if (rtRes?.data?.data) setTickers(rtRes.data.data);
      if (pengRes?.data?.data) setPengurus(pengRes.data.data);
      if (progRes?.data?.data) {
        // For each program, fetch details including comments (without email addresses)
        const progsWithComments = await Promise.all(
          progRes.data.data.map(async (p: any) => {
            const detailRes = await axios.get(`${apiUrl}/api/program-kerja/${p.id}`).catch(() => null);
            return detailRes?.data?.data || p;
          })
        );
        setPrograms(progsWithComments);
      }
      if (prodRes?.data?.data) setProducts(prodRes.data.data);
      if (unitRes?.data?.data) setUnits(unitRes.data.data);
      if (artRes?.data?.data) setArticles(artRes.data.data);
    } catch (error) {
      // Graceful fallback if offline
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchAllContent();

    // Setup real-time Socket.IO synchronization
    const socket = io(apiUrl);
    socket.emit('join_public_room');

    socket.on('content_update', () => {
      fetchAllContent();
    });

    socket.on('theme_update', () => {
      fetchAllContent();
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, fetchAllContent]);

  return (
    <main className="w-full flex flex-col min-h-screen bg-airBeningGunung text-hijauPedesaanTua selection:bg-kuningBungaMatahari selection:text-hijauPedesaanTua">
      {/* 1. Header with Glassmorphism & Digital Clock */}
      <Navbar identityName={identity.name} logoUrl={identity.logoUrl} />

      {/* 2. Running Text Ticker (Fade-out edge & interactive hover) */}
      <RunningTextTicker items={tickers} />

      {/* 3. Hero Section (Village / Mountain Spring Theme) */}
      <HeroSection identity={identity} />

      {/* 4. Program Kerja System (Modern Rustic Interactive Showcase) */}
      <ProgramKerjaShowcase programs={programs} onCommentSubmitted={fetchAllContent} />

      {/* 5. Advanced Product Catalog (Showcase: Gambar, Nama, Harga, Stok) */}
      <ShopeeCatalog products={products} />

      {/* 6. Carousel System (Pengurus) - "The Floating Leaf" */}
      <FloatingLeafCarousel items={pengurus} />

      {/* 7. Unit Usaha Section */}
      <UnitUsahaSection units={units} />

      {/* 8. Articles Section */}
      <ArticlesSection articles={articles} />

      {/* 9. Interactive Maps & Location Section */}
      <MapsSection identity={identity} />

      {/* 10. Footer */}
      <Footer identity={identity} />

      {/* 11. WhatsApp Shell Chat Widget & Fonnte System Engine */}
      <WhatsAppChatWidget identity={identity} />
    </main>
  );
}
