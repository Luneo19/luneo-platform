import Link from 'next/link';
import { Car } from 'lucide-react';

export const metadata = {
  title: 'Automotive Industry - Luneo',
};

export default function AutomotiveIndustryPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Car className="w-16 h-16 mb-6" />
          <h1 className="text-5xl font-bold mb-6">Automotive</h1>
          <p className="text-2xl text-blue-100 mb-8">Configurateur véhicule 3D, AR showroom</p>
          <Link href="/contact" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 inline-block">Démo automotive</Link>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Solutions Automotive</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Vehicle Configurator</h3>
            <p className="text-gray-600">Configuration complète du véhicule</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">AR Showroom</h3>
            <p className="text-gray-600">Showroom en réalité augmentée</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-xl mb-3">Virtual Test Drive</h3>
            <p className="text-gray-600">Essai virtuel immersif</p>
          </div>
        </div>
      </section>
    </div>
  );
}



