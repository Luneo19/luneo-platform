import Link from 'next/link';
import { BookOpen, Video, FileText, Code } from 'lucide-react';
export const metadata = { title: 'Resources - Luneo' };
export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Resources</h1>
          <p className="text-xl text-blue-100">Tout pour démarrer avec Luneo</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link href="/help/documentation" className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Documentation</h3>
          </Link>
          <Link href="/help/tutorials" className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <Video className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Tutorials</h3>
          </Link>
          <Link href="/blog" className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <BookOpen className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Blog</h3>
          </Link>
          <Link href="/help/documentation/examples" className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
            <Code className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <h3 className="font-bold text-lg">Code Examples</h3>
          </Link>
        </div>
      </section>
    </div>
  );
}
