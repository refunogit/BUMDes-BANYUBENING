'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { publicApi } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ProductGrid } from '@/components/features/product-grid';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

function SearchContent() {
  const params = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (!q) return;
    setLoading(true);
    publicApi.search(q).then(setResults).catch(()=>setResults(null)).finally(()=>setLoading(false));
  }, [q]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">Hasil pencarian: &quot;{q}&quot;</h1>
        {loading ? <p>Searching...</p> : results ? (
          <div className="space-y-8">
            <div>
              <h2 className="font-semibold mb-3">Produk ({results.products?.length || 0})</h2>
              <ProductGrid products={results.products || []} />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle>Artikel ({results.articles?.length || 0})</CardTitle></CardHeader>
                <div className="p-4 space-y-2">
                  {results.articles?.map((a:any)=><Link key={a.id} href={`/articles/${a.slug}`} className="block p-2 border rounded hover:bg-gray-50"><p className="font-medium text-sm">{a.title}</p><p className="text-xs text-muted-foreground">{a.category}</p></Link>)}
                </div>
              </Card>
              <Card>
                <CardHeader><CardTitle>Program Kerja ({results.programKerja?.length || 0})</CardTitle></CardHeader>
                <div className="p-4 space-y-2">
                  {results.programKerja?.map((p:any)=><div key={p.id} className="p-2 border rounded"><p className="font-medium text-sm">{p.title}</p><p className="text-xs text-muted-foreground">{p.status}</p></div>)}
                </div>
              </Card>
            </div>
          </div>
        ) : <p>Tidak ada hasil untuk &quot;{q}&quot;</p>}
      </main>
      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
