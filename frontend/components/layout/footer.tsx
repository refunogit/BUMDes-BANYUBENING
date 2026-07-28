'use client';
import Link from 'next/link';

export function Footer({ identity }: { identity?: any }) {
  return (
    <footer className="bg-gradient-to-br from-ocean-900 via-ocean-800 to-ocean-900 text-white">
      <div className="container px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-ocean-700 font-bold text-xl">
              B
            </div>
            <div>
              <h3 className="font-bold text-lg">{identity?.name || 'BUMDes BANYUBENING'}</h3>
              <p className="text-ocean-200 text-sm">Membangun Desa, Mensejahterakan Warga</p>
            </div>
          </div>
          <p className="text-ocean-100 text-sm leading-relaxed max-w-md">
            {identity?.description || 'Badan Usaha Milik Desa yang berkomitmen untuk memajukan perekonomian desa melalui pengembangan UMKM, jasa, dan perdagangan.'}
          </p>
          <div className="mt-4 space-y-1 text-sm text-ocean-200">
            <p>📍 {identity?.address || 'Desa Banyubening'}</p>
            <p>📞 {identity?.phone || '0812-3456-7890'}</p>
            <p>📧 {identity?.email || 'info@bumdes-banyubening.id'}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-leaf-200">Link Cepat</h4>
          <ul className="space-y-2 text-sm text-ocean-100">
            <li><Link href="/articles" className="hover:text-white transition">Artikel</Link></li>
            <li><Link href="/products" className="hover:text-white transition">Produk UMKM</Link></li>
            <li><Link href="/program-kerja" className="hover:text-white transition">Program Kerja</Link></li>
            <li><Link href="/pengurus" className="hover:text-white transition">Pengurus</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-leaf-200">Layanan</h4>
          <ul className="space-y-2 text-sm text-ocean-100">
            <li>Jasa Sewa Alat</li>
            <li>Perdagangan</li>
            <li>Produksi</li>
            <li>Pemberdayaan UMKM</li>
          </ul>
          <div className="mt-6 p-3 rounded-lg bg-white/10 backdrop-blur">
            <p className="text-xs text-ocean-200">Warna Komposisi</p>
            <div className="flex gap-1 mt-2">
              <div className="h-3 flex-1 bg-ocean-500 rounded" title="60% Ocean Blue"></div>
              <div className="h-3 w-6 bg-leaf-200 rounded" title="20% Light Green"></div>
              <div className="h-3 w-3 bg-red-500 rounded" title="10% Red"></div>
              <div className="h-3 w-3 bg-orange-500 rounded" title="10% Orange"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-ocean-700">
        <div className="container px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-ocean-200">
          <p>© {new Date().getFullYear()} BUMDes BANYUBENING. All rights reserved. Enterprise Grade System.</p>
          <p>💙 60% Ocean Blue • 💚 20% Light Green • ❤️ 10% Red • 🧡 10% Orange</p>
        </div>
      </div>
    </footer>
  );
}
