'use client';

import React, { memo, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ArrowRight } from 'lucide-react';
import { getAllArticles } from './data/articles';

function BlogPageContent() {
  const articles = useMemo(() => getAllArticles(), []);

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Blog Luneo</h1>
          <p className="text-xl text-blue-100">Articles, tutoriels et insights sur la 3D, l&apos;AR et la personnalisation produit</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-gray-800/50 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all">
              <div className="h-48 bg-gray-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" aria-hidden />
                <Image
                  src={article.imageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-400">{article.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{article.title}</h2>
                <p className="text-gray-300 mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <Link href={`/blog/${article.slug}`} className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1">
                    Lire <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

const BlogPageMemo = memo(BlogPageContent);

export default function BlogPage() {
  return (
    <ErrorBoundary componentName="BlogPage">
      <BlogPageMemo />
    </ErrorBoundary>
  );
}
