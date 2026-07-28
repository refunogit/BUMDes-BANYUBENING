'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    publicApi.getArticleBySlug(slug as string).then(a=>{
      setArticle(a?.data || a);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center flex-col gap-2"><p>Artikel tidak ditemukan</p><Link href="/"><Button>Home</Button></Link></div>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container px-4 py-8 max-w-3xl mx-auto">
        {article.coverImage && <img src={article.coverImage} alt={article.title} className="w-full aspect-video object-cover rounded-xl mb-6" />}
        <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{article.category} • {new Date(article.createdAt).toLocaleDateString('id-ID')} • 👁️ {article.views} views</p>
        <article className="prose prose-ocean max-w-none leading-relaxed whitespace-pre-wrap">{article.content}</article>
        <div className="mt-8 flex gap-2">
          <Link href="/articles"><Button variant="outline">← Kembali ke Artikel</Button></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
export const dynamic = 'force-dynamic';
