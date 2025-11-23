import Link from 'next/link';
import { Coffee } from 'lucide-react';

export const metadata = {
  title: 'Templates Mugs - Luneo',
  description: 'Bibliothèque de templates mugs personnalisables',
};

export default function MugsTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Coffee className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Templates Mugs</h1>
          <p className="text-xl text-orange-100 mb-6">Créez des mugs personnalisés avec nos templates 3D</p>
          <Link href="/register" className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 inline-block">
            Créer un mug
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="h-64 bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
                <Coffee className="w-24 h-24 text-orange-400" />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg mb-2">Mug Template {idx + 1}</h3>
                <p className="text-gray-600 text-sm mb-4">360° personnalisable</p>
                <Link href={`/demo/configurator?template=mug-${idx + 1}`} className="text-orange-600 hover:text-orange-700 font-semibold">
                  Personnaliser →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



