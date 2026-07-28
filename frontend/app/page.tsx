'use client';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { RunningText } from '@/components/layout/running-text';
import { DigitalClock } from '@/components/layout/digital-clock';
import { CarouselPengurus } from '@/components/layout/carousel-pengurus';
import { ProductGrid } from '@/components/features/product-grid';
import { FinancialCharts } from '@/components/features/financial-charts';
import { publicApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Package, Newspaper, Briefcase, Users, BarChart3 } from 'lucide-react';

interface HomeData {
  identity?: any;
  articles?: any[];
  products?: any[];
  runningTexts?: any[];
  pengurus?: any[];
  carousel?: any[];
  portfolio?: any[];
  programKerja?: any[];
}

export default function HomePage() {
  const [data, setData] = useState<HomeData>({});
  const [financial, setFinancial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const home = await publicApi.getHome().catch(() => {
          // Fallback if backend not ready
          return {
            identity: { name: 'BUMDes BANYUBENING', shortName: 'BUMDes' },
            articles: [],
            products: [],
            runningTexts: [{ id: '1', text: 'Selamat Datang di BUMDes BANYUBENING - Membangun Desa, Mensejahterakan Warga', emoji: '🌊' }],
            pengurus: [],
            carousel: [],
            portfolio: [],
            programKerja: [],
          };
        });
        setData(home);

        // Financial sanitized
        publicApi.getFinancialSummary().then(setFinancial).catch(() => {
          setFinancial({ labaRugi: { totalRevenue: 0, totalExpense: 0, netIncome: 0 }, neraca: { totalAsset: 0, totalLiability: 0, totalEquity: 0 }, arusKas: { operating: 0, investing: 0, financing: 0, netCashFlow: 0 } });
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime socket
    try {
      const socket = getSocket();
      socket.on('identity:updated', (identity) => setData(prev => ({ ...prev, identity })));
      socket.on('product:created', (product) => setData(prev => ({ ...prev, products: [product, ...(prev.products || [])].slice(0, 12) })));
      socket.on('article:created', (article) => setData(prev => ({ ...prev, articles: [article, ...(prev.articles || [])].slice(0, 6) })));

      return () => {
        socket.off('identity:updated');
        socket.off('product:created');
        socket.off('article:created');
      };
    } catch {}
  }, []);

  if (error && !data.identity) {
    // Failsafe: never show blank page
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ocean-50 to-white p-6">
        <Card className="max-w-lg w-full border-ocean-200">
          <CardHeader>
            <CardTitle className="text-ocean-800">BUMDes BANYUBENING</CardTitle>
            <p className="text-sm text-muted-foreground">Sistem sedang memuat - mode failsafe aktif</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">Backend belum tersedia, menampilkan mode statis. Pastikan backend berjalan di http://localhost:4000</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Link href="/admin"><Button className="bg-ocean-500">Ke Admin Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ocean-50/30 flex flex-col">
      <Navbar identity={data.identity} />
      <RunningText items={data.runningTexts} />

      <main className="flex-1">
        {/* Hero + Clock + Carousel */}
        <section className="container px-4 py-6 space-y-6">
          <DigitalClock />

          {/* Main Carousel Banner */}
          {data.carousel && data.carousel.length > 0 ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-gradient-to-br from-ocean-500 to-ocean-700">
              <img src={data.carousel[0].imageUrl} alt={data.carousel[0].title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div className="text-white">
                  <h1 className="text-2xl md:text-4xl font-bold drop-shadow-lg">{data.carousel[0].title || data.identity?.name}</h1>
                  <p className="text-white/80 mt-2">Badan Usaha Milik Desa Banyubening - Enterprise Grade</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-ocean-500 via-ocean-600 to-leaf-400 p-8 md:p-12 text-white relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <h1 className="text-3xl md:text-5xl font-bold leading-tight">🌊 BUMDes BANYUBENING</h1>
                <p className="mt-4 text-lg text-white/90">Membangun Desa, Mensejahterakan Warga dengan sistem enterprise-grade terintegrasi</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/products"><Button className="bg-white text-ocean-700 hover:bg-ocean-50"><Package className="h-4 w-4 mr-2" /> Lihat Produk</Button></Link>
                  <Link href="/articles"><Button variant="outline" className="border-white text-white hover:bg-white/10"><Newspaper className="h-4 w-4 mr-2" /> Artikel</Button></Link>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 opacity-20 text-[120px]">🏘️</div>
            </div>
          )}
        </section>

        {/* Stats Composition Color Palette Demo */}
        <section className="container px-4 py-4">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="p-3 rounded-lg bg-ocean-500 text-white"><div className="font-bold">60%</div><div>Ocean Blue</div></div>
            <div className="p-3 rounded-lg bg-leaf-200 text-green-800"><div className="font-bold">20%</div><div>Light Green</div></div>
            <div className="p-3 rounded-lg bg-red-500 text-white"><div className="font-bold">10%</div><div>Red</div></div>
            <div className="p-3 rounded-lg bg-orange-500 text-white"><div className="font-bold">10%</div><div>Orange</div></div>
          </div>
        </section>

        {/* Products Shopee-like */}
        <section className="container px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-ocean-500" /> Produk UMKM Unggulan</h2>
            <Link href="/products"><Button variant="ghost" size="sm">Lihat Semua <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </div>
          <ProductGrid products={data.products || []} loading={loading} />
        </section>

        {/* Pengurus Carousel 50% blue 50% red */}
        <section className="container px-4 py-8">
          <CarouselPengurus pengurus={data.pengurus || []} />
        </section>

        {/* Articles */}
        <section className="container px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Newspaper className="h-6 w-6 text-ocean-500" /> Artikel Terbaru</h2>
            <Link href="/articles"><Button variant="ghost" size="sm">Semua Artikel <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {(data.articles || []).map((article: any) => (
              <Link key={article.id} href={`/articles/${article.slug}`} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {article.coverImage ? <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📰</div>}
                  </div>
                  <CardHeader className="p-4">
                    <h3 className="font-semibold line-clamp-2 group-hover:text-ocean-600">{article.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{article.excerpt}</p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {(!data.articles || data.articles.length === 0) && !loading && (
              <Card className="md:col-span-3 p-8 text-center text-muted-foreground">Belum ada artikel</Card>
            )}
          </div>
        </section>

        {/* Program Kerja */}
        <section className="container px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Briefcase className="h-6 w-6 text-leaf-500" /> Program Kerja</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {(data.programKerja || []).map((prog: any) => (
              <Card key={prog.id} className="border-l-4 border-l-ocean-500 hover:shadow-md transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{prog.title}</CardTitle>
                    <span className={`text-xs px-2 py-1 rounded-full ${prog.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : prog.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{prog.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{prog.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1"><span>Progress</span><span>{prog.progress}%</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-ocean-500 to-leaf-400" style={{ width: `${prog.progress}%` }} /></div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Financial Charts Sanitized */}
        <section className="container px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><BarChart3 className="h-6 w-6 text-ocean-500" /> Transparansi Keuangan (Publik)</h2>
          <FinancialCharts data={financial} />
          <p className="text-xs text-muted-foreground mt-3 text-center">Data disanitasi untuk publik • Detail lengkap tersedia di laporan audit internal</p>
        </section>

        {/* Portfolio */}
        {data.portfolio && data.portfolio.length > 0 && (
          <section className="container px-4 py-8">
            <h2 className="text-2xl font-bold mb-6">Portfolio Kegiatan</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {data.portfolio.map((p: any) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100">
                    {p.coverImage ? <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📸</div>}
                  </div>
                  <CardHeader className="p-4"><CardTitle className="text-base">{p.title}</CardTitle><p className="text-xs text-muted-foreground">{p.category}</p></CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer identity={data.identity} />
    </div>
  );
}
