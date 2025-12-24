'use client';

import React, { memo, useMemo } from 'react';
import { BookOpen, Video, Code, FileText } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function TutorialsPageContent() {
  const tutorials = useMemo(() => [
    { icon: Video, title: 'Video: Intégration Shopify en 15 min', category: 'Video', duration: '15 min' },
    { icon: Code, title: 'Code: Créer un configurateur React', category: 'Code', duration: '30 min' },
    { icon: FileText, title: 'Guide: Setup AR for iOS & Android', category: 'Guide', duration: '20 min' },
    { icon: Video, title: 'Video: AI Generation avancée', category: 'Video', duration: '10 min' }
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Tutorials</h1>
          <p className="text-xl text-blue-100">Apprenez à maîtriser Luneo</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          {tutorials.map((tuto, idx) => {
            const Icon = tuto.icon;
            return (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 flex items-start gap-4">
                <Icon className="w-10 h-10 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-blue-600 uppercase">{tuto.category}</span>
                  <h3 className="font-bold text-lg mt-1 mb-2">{tuto.title}</h3>
                  <span className="text-sm text-gray-500">{tuto.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const TutorialsPageMemo = memo(TutorialsPageContent);

export default function TutorialsPage() {
  return (
    <ErrorBoundary componentName="TutorialsPage">
      <TutorialsPageMemo />
    </ErrorBoundary>
  );
}
