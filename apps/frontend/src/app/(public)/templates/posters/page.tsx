import Link from 'next/link';
export const metadata = { title: 'Posters Templates - Luneo' };
export default function PostersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">Posters Templates</h1>
      <p className="text-xl text-gray-600 mb-8">Plus de 400 templates posters personnalisables</p>
      <div className="grid md:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-6">
            <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-4"></div>
            <h3 className="font-bold">Poster {idx + 1}</h3>
            <Link href={`/demo/customizer?template=poster-${idx + 1}`} className="text-blue-600 hover:text-blue-700 font-semibold">Personnaliser →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}



