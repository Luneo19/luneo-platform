export const metadata = { title: 'Electronics Industry - Luneo' };
export default function ElectronicsIndustryPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <h1 className="text-5xl font-bold mb-6">Electronics</h1>
      <p className="text-xl text-gray-600 mb-8">Configuration tech products en 3D</p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">PC Builder</h3>
          <p className="text-gray-600 text-sm">Configurateur PC gaming</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">Smartphones</h3>
          <p className="text-gray-600 text-sm">Personnalisation coques</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="font-bold mb-2">AR Placement</h3>
          <p className="text-gray-600 text-sm">TV, sound systems</p>
        </div>
      </div>
    </div>
  );
}



