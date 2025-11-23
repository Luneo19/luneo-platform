import Link from 'next/link';
import { Armchair } from 'lucide-react';

export const metadata = {
  title: 'Furniture Industry - Luneo',
};

export default function FurnitureIndustryPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Armchair className="w-16 h-16 mb-6" />
          <h1 className="text-5xl font-bold mb-6">Furniture & Home Decor</h1>
          <p className="text-2xl text-amber-100 mb-8">AR placement, 3D configurator pour mobilier</p>
          <Link href="/contact" className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 inline-block">Démo furniture</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Solutions Mobilier</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">AR Placement</h3>
            <p className="text-gray-600">Visualisation dans votre intérieur</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Material Configurator</h3>
            <p className="text-gray-600">Choix tissus, couleurs, finitions</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Room Planner</h3>
            <p className="text-gray-600">Aménagement 3D complet</p>
          </div>
        </div>
      </section>
    </div>
  );
}



