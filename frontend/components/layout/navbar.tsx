'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, Home, Newspaper, Briefcase, Package, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Identity {
  name: string;
  logoUrl?: string;
  shortName?: string;
}

export function Navbar({ identity }: { identity?: Identity }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-bold text-lg">
            {identity?.shortName?.[0] || 'B'}
          </div>
          <div className="hidden md:block">
            <h1 className="font-bold text-ocean-700 leading-none">{identity?.name || 'BUMDes BANYUBENING'}</h1>
            <p className="text-xs text-muted-foreground">Desa Banyubening</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: '/', label: 'Beranda', icon: Home },
            { href: '/articles', label: 'Artikel', icon: Newspaper },
            { href: '/program-kerja', label: 'Program', icon: Briefcase },
            { href: '/products', label: 'Produk', icon: Package },
            { href: '/pengurus', label: 'Pengurus', icon: Users },
          ].map(item => (
            <Link key={item.href} href={item.href} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-ocean-50 hover:text-ocean-700 transition flex items-center gap-1.5">
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk, artikel..."
              className="pl-9 w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && search.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(search)}`;
                }
              }}
            />
          </div>
          <Link href="/admin" className="hidden md:block">
            <Button variant="outline" size="sm" className="border-ocean-200">Admin</Button>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t bg-white p-4 space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari..." className="pl-9 w-full" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {[
            { href: '/', label: 'Beranda' },
            { href: '/articles', label: 'Artikel' },
            { href: '/program-kerja', label: 'Program Kerja' },
            { href: '/products', label: 'Produk' },
            { href: '/pengurus', label: 'Pengurus' },
          ].map(item => (
            <Link key={item.href} href={item.href} className="block px-3 py-2 rounded-md hover:bg-ocean-50" onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/admin" className="block pt-2">
            <Button className="w-full bg-ocean-500 hover:bg-ocean-600">Admin Dashboard</Button>
          </Link>
        </div>
      )}
    </header>
  );
}
