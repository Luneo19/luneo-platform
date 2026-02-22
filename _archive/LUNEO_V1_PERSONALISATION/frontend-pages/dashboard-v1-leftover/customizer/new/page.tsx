'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { CustomizerForm } from '@/components/Customizer/admin/CustomizerForm';

function NewCustomizerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') || undefined;

  const handleSuccess = (config: { id?: string }) => {
    const id = config.id;
    if (id) {
      router.push(`/dashboard/customizer/${id}`);
    } else {
      router.push('/dashboard/customizer');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/customizer">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour aux customizers
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Créer un nouveau customizer</h1>
        <p className="text-muted-foreground">Configurez un éditeur visuel pour vos produits</p>
      </div>

      <CustomizerForm
        initialProductId={productId}
        onSuccess={handleSuccess}
        onCancel={() => router.push('/dashboard/customizer')}
      />
    </div>
  );
}

export default function NewCustomizerPage() {
  return (
    <ErrorBoundary level="page" componentName="NewCustomizerPage">
      <NewCustomizerContent />
    </ErrorBoundary>
  );
}
