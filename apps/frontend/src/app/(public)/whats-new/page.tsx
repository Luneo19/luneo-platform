import Link from 'next/link';
export const metadata = { title: 'What\'s New - Luneo' };
export default function WhatsNewPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">What's New in Luneo</h1>
      <p className="text-xl text-gray-600 mb-8">Les dernières nouveautés et améliorations</p>
      <Link href="/changelog" className="text-blue-600 hover:text-blue-700 font-semibold">Voir le changelog complet →</Link>
    </div>
  );
}



