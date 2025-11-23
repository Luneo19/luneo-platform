import Link from 'next/link';
import { Palette, Check } from 'lucide-react';

export const metadata = {
  title: 'Branding Use Case - Luneo',
};

export default function BrandingUseCasePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Palette className="w-16 h-16 mb-6" />
          <h1 className="text-5xl font-bold mb-6">Branding & Design System</h1>
          <p className="text-2xl text-amber-100 mb-8">
            Créez et maintenez votre design system cohérent sur tous les supports.
          </p>
          <Link href="/contact" className="bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-amber-50 inline-block">
            Parler à un expert
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Design System Complet</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            'Brand colors & typography',
            'Logo variants & guidelines',
            'Templates brandés réutilisables',
            'Asset library centralisée',
            'Version control designs',
            'Export guidelines automatique',
            'Collaboration équipe créa',
            'White-label pour agences',
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



