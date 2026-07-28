'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Package, Newspaper, Briefcase, Users, Type, ImageIcon, FolderKanban, Settings, Wallet, MessageSquare, Bell, Search, LogOut, Menu, X, FileText } from 'lucide-react';

const menu = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/identity', label: 'Identitas', icon: Settings },
  { href: '/admin/articles', label: 'Artikel', icon: Newspaper },
  { href: '/admin/program-kerja', label: 'Program Kerja', icon: Briefcase },
  { href: '/admin/running-text', label: 'Running Text', icon: Type },
  { href: '/admin/pengurus', label: 'Pengurus', icon: Users },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/portfolio', label: 'Portfolio', icon: FolderKanban },
  { href: '/admin/carousel', label: 'Carousel', icon: ImageIcon },
  { href: '/admin/finance', label: 'Keuangan', icon: Wallet },
  { href: '/admin/whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
  { href: '/admin/backup', label: 'Backup', icon: FileText },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== '/admin/login' && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Memeriksa autentikasi...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm transform transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:static lg:inset-auto flex flex-col`}>
        <div className="h-16 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-ocean-500 flex items-center justify-center text-white font-bold">B</div>
            <div><p className="font-bold text-sm">BUMDes Admin</p><p className="text-xs text-muted-foreground">Enterprise</p></div>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {menu.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-ocean-500 text-white shadow' : 'hover:bg-ocean-50 text-gray-700'}`}>
                <item.icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t">
          <div className="bg-ocean-50 rounded-lg p-3 mb-3">
            <p className="text-sm font-medium">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={() => { logout(); router.push('/admin/login'); }}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          <div className="flex-1 hidden md:block"><h1 className="font-semibold">{menu.find(m => pathname.startsWith(m.href))?.label || 'Dashboard'}</h1></div>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank"><Button variant="outline" size="sm">Lihat Website</Button></Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
