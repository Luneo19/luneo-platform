import Link from 'next/link';
import { Building } from 'lucide-react';
export const metadata = { title: 'Industries - Luneo' };
export default function IndustriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Building className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Industries</h1>
          <p className="text-xl text-indigo-100">Solutions adaptées à votre secteur</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: 'Fashion & Apparel', link: '/industries/fashion' },
            { name: 'Furniture & Home', link: '/industries/furniture' },
            { name: 'Automotive', link: '/industries/automotive' },
            { name: 'Jewelry', link: '/industries/jewelry' },
            { name: 'Sports & Outdoor', link: '/industries/sports' },
            { name: 'Electronics', link: '/industries/electronics' },
          ].map((industry) => (
            <Link key={industry.name} href={industry.link} className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <h3 className="font-bold text-xl">{industry.name}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}



