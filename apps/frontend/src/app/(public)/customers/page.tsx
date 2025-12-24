'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Users } from 'lucide-react';

function CustomersPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Nos Clients</h1>
          <p className="text-xl text-blue-100">Plus de 5000 entreprises nous font confiance</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="bg-gray-800/50 rounded-xl shadow-lg p-8 flex items-center justify-center border border-gray-700">
              <div className="w-32 h-16 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const MemoizedCustomersPageContent = memo(CustomersPageContent);

export default function CustomersPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomersPage">
      <MemoizedCustomersPageContent />
    </ErrorBoundary>
  );
}
