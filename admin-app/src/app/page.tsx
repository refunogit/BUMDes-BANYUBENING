'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/gerbang-internal-bumdes');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-airBeningGunung text-hijauPedesaanTua font-medium">
      Mengalihkan ke Gerbang Internal BUMDes...
    </div>
  );
}
