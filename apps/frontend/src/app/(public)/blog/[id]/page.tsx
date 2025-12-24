'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, User, ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function BlogArticlePageContent() {
  const params = useParams();
  const id = params.id as string;
  const slugLabel = id.replace(/-/g, ' ');

  const article = useMemo(() => ({
    title: 'Comment le Virtual Try-On augmente vos conversions',
    date: '2025-11-01',
    author: 'Équipe Luneo',
    content: `Le Virtual Try-On révolutionne l'e-commerce en permettant aux clients d'essayer virtuellement les produits avant achat.

Nos études montrent une augmentation moyenne de 40% des conversions et une réduction de 60% des retours produits.

La technologie MediaPipe permet un tracking facial ultra-précis avec 468 landmarks en temps réel, offrant une expérience AR immersive et réaliste.`
  }), []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog">
          <Button variant="ghost" className="mb-8 text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au blog
          </Button>
        </Link>

        <Card className="p-8 bg-gray-800/50 border-gray-700">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(article.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>
            <span className="px-3 py-1 bg-blue-900/30 text-blue-300 rounded-full uppercase tracking-wide text-xs">
              {slugLabel}
            </span>
          </div>

          <div className="prose prose-invert max-w-none">
            {article.content.split('\n\n').map((para, i) => (
              <p key={i} className="text-gray-300 mb-4">{para}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const BlogArticlePageMemo = memo(BlogArticlePageContent);

export default function BlogArticlePage() {
  return (
    <ErrorBoundary componentName="BlogArticlePage">
      <BlogArticlePageMemo />
    </ErrorBoundary>
  );
}

