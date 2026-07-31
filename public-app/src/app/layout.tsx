import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BUMDes Banyubening - Kemandirian Ekonomi Desa & Pengelolaan Mata Air Gunung',
  description:
    'Badan Usaha Milik Desa (BUMDes) Banyubening, Kecamatan Bejen, Kabupaten Temanggung - Transparansi Keuangan, Program Kerja Desa, Katalog Produk UMKM, dan Ekowisata Mata Air Bening Gunung.',
  keywords: 'BUMDes, Banyubening, Mata Air Gunung, AMDK, UMKM Desa, Temanggung, Wisata Air Bening',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col antialiased selection:bg-kuningBungaMatahari selection:text-hijauPedesaanTua">
        {children}
      </body>
    </html>
  );
}
