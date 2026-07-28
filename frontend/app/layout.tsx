import type { Metadata } from 'next';
import './globals.css';
// Removed Google Font due to offline build - using system font
const inter = { className: 'font-sans' };

export const metadata: Metadata = {
  title: 'BUMDes BANYUBENING - Membangun Desa, Mensejahterakan Warga',
  description: 'Website resmi BUMDes Banyubening - Badan Usaha Milik Desa dengan sistem enterprise-grade, produk UMKM, layanan jasa dan keuangan audit-ready',
  keywords: 'BUMDes, Banyubening, BUMDes Banyubening, UMKM, Desa, Jawa Tengah',
  authors: [{ name: 'BUMDes Banyubening Enterprise Team' }],
  openGraph: {
    title: 'BUMDes BANYUBENING',
    description: 'Membangun Desa, Mensejahterakan Warga',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background antialiased`}>
        <div id="root-failsafe">
          {children}
        </div>
        {/* Failsafe: never blank page */}
        <noscript>
          <div className="min-h-screen flex items-center justify-center bg-ocean-50 p-8 text-center">
            <div className="max-w-md">
              <h1 className="text-2xl font-bold text-ocean-800">BUMDes BANYUBENING</h1>
              <p className="mt-2 text-muted-foreground">Silakan aktifkan JavaScript untuk pengalaman terbaik. Sistem tetap berjalan dengan mode terbatas.</p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  );
}
