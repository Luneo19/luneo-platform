import Link from 'next/link';
import { Lightbulb } from 'lucide-react';
export const metadata = { title: 'Use Cases - Luneo' };
export default function UseCasesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Lightbulb className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Use Cases</h1>
          <p className="text-xl text-orange-100">Découvrez comment utiliser Luneo</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'E-commerce', link: '/use-cases/e-commerce' },
            { name: 'Marketing', link: '/use-cases/marketing' },
            { name: 'Branding', link: '/use-cases/branding' },
            { name: 'Print-on-Demand', link: '/use-cases/print-on-demand' },
            { name: 'Dropshipping', link: '/use-cases/dropshipping' },
            { name: 'Agency', link: '/use-cases/agency' },
          ].map((useCase) => (
            <Link key={useCase.name} href={useCase.link} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-xl">{useCase.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}



