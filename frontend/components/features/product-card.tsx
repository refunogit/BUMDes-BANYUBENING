'use client';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Star, Eye, ShoppingCart } from 'lucide-react';

export function ProductCard({ product }: { product: any }) {
  const primaryImage = product.images?.[0]?.url || product.coverImage || '/placeholder-product.jpg';
  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const hasDiscount = discountPrice && discountPrice < price;
  const discountPercent = hasDiscount ? Math.round((1 - discountPrice / price) * 100) : 0;

  return (
    <Link href={`/products/${product.slug}`} className="product-card group block rounded-xl overflow-hidden bg-white">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img src={primaryImage} alt={product.name} className="product-image w-full h-full object-cover" loading="lazy" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && <Badge className="bg-red-500 text-white text-[10px]">-{discountPercent}%</Badge>}
          {product.isFeatured && <Badge className="bg-orange-500 text-white text-[10px]">Featured</Badge>}
        </div>

        {/* Views + Sold overlay - Shopee-like */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-between items-end">
          <span className="text-white text-[11px] flex items-center gap-1">
            <Eye className="h-3 w-3" /> {product.views || 0}
          </span>
          <span className="text-white text-[11px]">Terjual {product.soldCount || 0}</span>
        </div>

        {/* Hover action */}
        <div className="absolute inset-0 bg-ocean-900/0 group-hover:bg-ocean-900/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white/90 text-ocean-700 text-xs px-3 py-1.5 rounded-full shadow-lg">Lihat Detail</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[40px] group-hover:text-ocean-600 transition-colors">{product.name}</h3>
        
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-bold text-ocean-600 text-[15px]">
            {formatCurrency(hasDiscount ? discountPrice! : price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] line-through text-muted-foreground">{formatCurrency(price)}</span>
          )}
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[11px] text-muted-foreground">{product.rating?.toFixed(1) || '5.0'}</span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{product.category}</span>
        </div>

        <div className="mt-1 text-[11px] text-muted-foreground">
          Stok: {product.stock} • {product.weight ? `${product.weight}g` : ''}
        </div>
      </div>
    </Link>
  );
}
