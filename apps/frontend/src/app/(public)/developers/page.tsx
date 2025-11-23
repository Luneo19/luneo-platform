import Link from 'next/link';
import { Code } from 'lucide-react';
export const metadata = { title: 'Developers - Luneo' };
export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Code className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Built for Developers</h1>
          <p className="text-2xl text-gray-300 mb-8">API-first, SDK-ready, Documentation complète</p>
          <div className="flex gap-4 justify-center">
            <Link href="/help/documentation/quickstart" className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">Quickstart</Link>
            <Link href="/help/documentation/api-reference" className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600">API Reference</Link>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/help/documentation/sdk/react" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-xl mb-2">React SDK</h3>
            <p className="text-gray-600">Composants React ready-to-use</p>
          </Link>
          <Link href="/help/documentation/sdk/vue" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-xl mb-2">Vue SDK</h3>
            <p className="text-gray-600">Plugin Vue.js complet</p>
          </Link>
          <Link href="/help/documentation/cli" className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <h3 className="font-bold text-xl mb-2">CLI Tool</h3>
            <p className="text-gray-600">Automatisation CI/CD</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
