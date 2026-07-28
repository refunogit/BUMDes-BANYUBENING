'use client';
import { ProductCard } from './product-card';

export function ProductGrid({ products, loading }: { products: any[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-xl">
        <p className="text-4xl mb-2">🛍️</p>
        <p className="text-muted-foreground">Belum ada produk tersedia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
