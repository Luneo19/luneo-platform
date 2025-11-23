import Link from 'next/link';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const metadata = {
  title: 'FAQ - Luneo',
};

const faqs = [
  { q: 'Quelle est la différence entre Starter et Pro ?', a: 'Le plan Pro inclut plus de générations AI, le support prioritaire, et des features avancées.' },
  { q: 'Puis-je annuler mon abonnement ?', a: 'Oui, à tout moment depuis votre dashboard. Pas de frais cachés.' },
  { q: 'Les modèles 3D sont-ils optimisés pour mobile ?', a: 'Oui, tous nos exports sont optimisés pour mobile avec LOD automatique.' },
  { q: 'Y a-t-il une période d\'essai ?', a: 'Oui, 14 jours gratuits sur tous les plans payants.' },
  { q: 'Quels formats d\'export sont supportés ?', a: 'GLB, USDZ, FBX, OBJ pour la 3D. PNG, SVG, PDF pour la 2D.' },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">FAQ</h1>
          <p className="text-xl text-indigo-100">Questions fréquentes</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="bg-white rounded-xl shadow-lg p-6 group">
              <summary className="flex items-center justify-between cursor-pointer font-bold text-lg text-gray-900">
                {faq.q}
                <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
              </summary>
              <p className="mt-4 text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Vous ne trouvez pas votre réponse ?</p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-semibold">
            Contactez notre support →
          </Link>
        </div>
      </section>
    </div>
  );
}



