import { Quote } from 'lucide-react';
export const metadata = { title: 'Testimonials - Luneo' };
const testimonials = [
  { name: 'Jean D.', role: 'CEO, Fashion Brand', text: 'Luneo a transformé notre e-commerce. +45% de conversion avec l\'AR.' },
  { name: 'Marie L.', role: 'Designer', text: 'L\'AI generation me fait gagner 10h/semaine. Incroyable.' },
  { name: 'Pierre M.', role: 'CTO, Print Company', text: 'API super simple, SDK React top. Intégration en 2h.' },
];
export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Quote className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Ce qu'en disent nos clients</h1>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-8">
              <Quote className="w-8 h-8 text-purple-600 mb-4" />
              <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-sm text-gray-600">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}



