import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gerbang Internal BUMDes Banyubening - SuperAdmin System 2026',
  description: 'Sistem Kontrol Penuh Internal BUMDes Banyubening (Domain Terpisah Tidak Publik).',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
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
