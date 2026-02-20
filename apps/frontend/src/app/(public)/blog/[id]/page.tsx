'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Calendar, User, ArrowLeft, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getArticleBySlug } from '../data/articles';

function BlogArticlePageContent() {
  const params = useParams();
  const slug = params.id as string;

  const article = useMemo(() => getArticleBySlug(slug), [slug]);

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-900 py-12 px-4 flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-6">Article introuvable.</p>
        <Link href="/blog">
          <Button variant="ghost" className="text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/blog">
          <Button variant="ghost" className="mb-8 text-blue-400 hover:text-blue-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au blog
          </Button>
        </Link>

        <Card className="overflow-hidden bg-gray-800/50 border-gray-700">
          <div className="h-56 md:h-72 bg-gray-700/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" aria-hidden />
            <Image
              src={article.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
          </div>
          <div className="p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
                {article.category}
              </span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{article.title}</h1>

            <div className="flex items-center gap-6 text-sm text-gray-400 mb-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{article.author}</span>
              </div>
            </div>
            {article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-700/80 text-gray-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div
              className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-em:text-gray-200"
              dangerouslySetInnerHTML={{ __html: article.content.trim() }}
            />
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

