import { Download } from 'lucide-react';
export const metadata = { title: 'Downloads - Luneo' };
export default function DownloadsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Download className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Downloads</h1>
          <p className="text-xl text-green-100">Téléchargez nos outils et ressources</p>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="space-y-4">
          {[
            { name: 'Luneo CLI', version: 'v2.5.0', platform: 'macOS, Linux, Windows' },
            { name: 'Shopify Plugin', version: 'v1.2.0', platform: 'Shopify App Store' },
            { name: 'WooCommerce Plugin', version: 'v1.1.0', platform: 'WordPress.org' },
            { name: 'Press Kit', version: '2025', platform: 'PDF, Images' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xl">{item.name}</h3>
                <p className="text-gray-600">{item.version} • {item.platform}</p>
              </div>
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">Download</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
