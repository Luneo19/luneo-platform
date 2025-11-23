import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Blog - Luneo',
  description: 'Articles, tutorials, et actualités Luneo',
};

const articles = [
  {
    id: 1,
    title: 'Comment intégrer la 3D dans votre e-commerce',
    excerpt: 'Guide complet pour ajouter la visualisation 3D à votre boutique',
    category: 'Tutorial',
    date: '6 Nov 2025',
    readTime: '5 min',
  },
  {
    id: 2,
    title: 'Les avantages de l\'AR pour le retail',
    excerpt: 'Pourquoi la réalité augmentée booste les conversions de 35%',
    category: 'Insight',
    date: '4 Nov 2025',
    readTime: '3 min',
  },
  {
    id: 3,
    title: 'Luneo v2.5 : Nouvelles fonctionnalités',
    excerpt: 'Découvrez les nouveautés de la version 2.5',
    category: 'Product',
    date: '1 Nov 2025',
    readTime: '4 min',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Blog Luneo</h1>
          <p className="text-xl text-blue-100">Articles, tutorials, et insights sur la 3D/AR</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <article key={article.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100"></div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500">{article.readTime}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h2>
                <p className="text-gray-600 mb-4">{article.excerpt}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{article.date}</span>
                  <Link href={`/blog/${article.id}`} className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
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
