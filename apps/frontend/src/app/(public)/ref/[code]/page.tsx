'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * /ref/[code] — Redirects to register with referral code (e.g. /ref/LUNEO-ABC123 → /register?ref=LUNEO-ABC123)
 */
export default function RefCodePage() {
  const params = useParams();
  const router = useRouter();
  const code = typeof params.code === 'string' ? params.code : '';

  useEffect(() => {
    if (code) {
      router.replace(`/register?ref=${encodeURIComponent(code)}`);
    } else {
      router.replace('/referral');
    }
  }, [code, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <p className="text-gray-400">Redirection...</p>
    </div>
  );
}
