'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DatabaseConfigPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Base de données</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Stack actuelle</h2>
          <p className="text-gray-300 mb-4">
            Luneo utilise <strong>PostgreSQL</strong> comme base de données, gérée via <strong>Prisma ORM</strong> côté backend NestJS.
            La connexion et les migrations sont entièrement gérées par l&apos;API backend ; le frontend n&apos;a pas besoin de variables de base de données.
          </p>
          <p className="text-gray-300 text-sm">
            Pour configurer l&apos;environnement backend (DATABASE_URL, etc.), reportez-vous à la documentation du déploiement backend ou à la section Variables d&apos;environnement.
          </p>
        </Card>
      </div>
    </div>
  );
}

const DatabaseConfigPageMemo = memo(DatabaseConfigPageContent);

export default function DatabaseConfigPage() {
  return (
    <ErrorBoundary componentName="DatabaseConfigPage">
      <DatabaseConfigPageMemo />
    </ErrorBoundary>
  );
}
