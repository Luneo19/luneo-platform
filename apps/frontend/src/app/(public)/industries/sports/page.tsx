export const metadata = { title: 'Sports Industry - Luneo' };
export default function SportsIndustryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">Sports & Outdoor</h1>
      <p className="text-xl text-gray-600 mb-8">Personnalisation équipement sportif</p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">Chaussures Custom</h3>
          <p className="text-gray-600 text-sm">Nike By You style</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">Maillots équipe</h3>
          <p className="text-gray-600 text-sm">Design personnalisé</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">Équipement</h3>
          <p className="text-gray-600 text-sm">Raquettes, vélos, skis</p>
        </div>
      </div>
    </div>
  );
}



