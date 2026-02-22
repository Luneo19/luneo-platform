'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ThreeDViewPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.productId as string;
  
  useEffect(() => {
    // Redirect to configure-3d
    router.replace(`/configure-3d/${productId}`);
  }, [router, productId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-4">
      <div className="text-center">
        <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-sm sm:text-base text-gray-300">Redirection...</p>
      </div>
    </div>
  );
}
