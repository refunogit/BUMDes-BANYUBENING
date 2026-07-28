'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductGallery } from '@/components/features/product-gallery';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    publicApi.getProductBySlug(slug as string).then(p=>{
      if (p?.data) setProduct(p.data);
      else setProduct(p);
    }).catch(()=>setProduct(null)).finally(()=>setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading produk...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center flex-col gap-4"><p>Produk tidak ditemukan</p><Link href="/"><Button>Kembali</Button></Link></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow">
          <ProductGallery images={product.images || []} name={product.name} />
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground">{product.category} • SKU: {product.sku}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-ocean-600">{formatCurrency(Number(product.discountPrice || product.price))}</span>
              {product.discountPrice && <span className="line-through text-muted-foreground">{formatCurrency(Number(product.price))}</span>}
            </div>
            <div className="flex gap-4 text-sm">
              <span>Stok: {product.stock}</span>
              <span>Terjual: {product.soldCount}</span>
              <span>Views: {product.views}</span>
            </div>
            <Card><CardContent className="p-4 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</CardContent></Card>
            <div className="flex gap-3">
              <a href={`https://wa.me/628123456789?text=Halo, saya tertarik dengan ${product.name}`} target="_blank" className="flex-1"><Button className="w-full bg-green-600 hover:bg-green-700">💬 Pesan via WhatsApp</Button></a>
              <Link href="/products"><Button variant="outline">Kembali</Button></Link>
            </div>
            <p className="text-xs text-muted-foreground">✅ Shopee-like UX • Smooth hover • Image gallery • Realtime views</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
export const dynamic = 'force-dynamic';
