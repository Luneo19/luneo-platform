import Link from 'next/link';
import { Eye, Heart, Star } from 'lucide-react';

export default function ShowcasePage() {
  const showcases = [
    {
      title: 'T-Shirt Vintage',
      creator: 'Marie D.',
      likes: 234,
      views: 1520,
      image: '👕',
    },
    {
      title: 'Mug Personnalisé',
      creator: 'Thomas M.',
      likes: 156,
      views: 980,
      image: '☕',
    },
    {
      title: 'Poster 3D',
      creator: 'Sophie L.',
      likes: 412,
      views: 2340,
      image: '🖼️',
    },
    {
      title: 'Casquette Custom',
      creator: 'Lucas B.',
      likes: 89,
      views: 650,
      image: '🧢',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Showcase
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Découvrez les meilleures créations de la communauté
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcases.map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-6xl">
                {item.image}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  par {item.creator}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {item.likes}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {item.views}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all">
            <Star className="w-5 h-5" />
            Créer mon design
          </Link>
        </div>
      </div>
    </div>
  );
}

