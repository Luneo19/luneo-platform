import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import { createHmac, timingSafeEqual } from 'crypto';
import { logger } from '@/lib/logger';
import { appRoutes } from '@/lib/routes';
import { QuotaShareClient } from './QuotaShareClient';

type SharedQuotaPayload = {
  brandId: string;
  plan: string;
  overage: number;
  recommendation: string | null;
  pressure: {
    metric: string;
    percentage: number;
  } | null;
  timestamp: string;
  exp?: number;
};

const SHARE_SECRET = process.env.QUOTA_SHARE_SECRET || 'dev-share-secret-not-for-production';

type QuotaSharePageProps = {
  params: Promise<{ token: string }>;
};

function verifyShareToken(token: string): SharedQuotaPayload | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) {
      return null;
    }
    const expected = createHmac('sha256', SHARE_SECRET).update(encoded).digest('base64url');
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SharedQuotaPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (error) {
    logger.error('Failed to verify share token', {
      error,
      token: token?.substring(0, 10) + '...',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

export default async function QuotaSharePage({ params }: QuotaSharePageProps) {
  const { token } = await params;
  const sharedData = verifyShareToken(token);

  if (!sharedData) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white px-6 py-12">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <Card className="bg-gray-900/70 border border-red-500/40 px-8 py-12 space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-300">
              <Shield className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">Lien invalide ou expiré</h1>
            <p className="text-gray-400">
              Impossible de décoder le snapshot partagé. Vérifiez que le lien est complet ou demandez un nouvel
              export depuis le dashboard.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline" className="border-gray-700 text-gray-200">
                <Link href={appRoutes.analytics}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au cockpit
                </Link>
              </Button>
              <Button asChild>
                <Link href={appRoutes.contact}>Contacter le support</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return <QuotaShareClient sharedData={sharedData} />;
}
