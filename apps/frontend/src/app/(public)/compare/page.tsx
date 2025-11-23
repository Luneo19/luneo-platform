import { GitCompare, Check, X } from 'lucide-react';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Compare Plans - Luneo',
};

export default function ComparePage() {
  const planRows: Array<{
    feature: string;
    values: ReactNode[];
  }> = [
    {
      feature: 'AI Generations',
      values: ['100/mois', '1000/mois', '5000/mois', 'Illimité'],
    },
    {
      feature: '3D Exports',
      values: Array.from({ length: 4 }, (_, index) => (
        <Check key={`exports-${index}`} className="w-5 h-5 text-green-600 mx-auto" />
      )),
    },
    {
      feature: 'AR Support',
      values: [
        <X key="ar-starter" className="w-5 h-5 text-red-400 mx-auto" />,
        ...Array.from({ length: 3 }, (_, index) => (
          <Check key={`ar-${index}`} className="w-5 h-5 text-green-600 mx-auto" />
        )),
      ],
    },
    {
      feature: 'Support',
      values: ['Email', 'Priority', '24/7', 'Dedicated'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <GitCompare className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Compare Plans</h1>
          <p className="text-xl text-blue-100">Trouvez le plan adapté à vos besoins</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold">Feature</th>
                <th className="px-6 py-4 text-center font-bold">Starter</th>
                <th className="px-6 py-4 text-center font-bold">Pro</th>
                <th className="px-6 py-4 text-center font-bold">Business</th>
                <th className="px-6 py-4 text-center font-bold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {planRows.map((row) => (
                <tr key={row.feature}>
                  <td className="px-6 py-4 font-semibold">{row.feature}</td>
                  {row.values.map((value, index) => (
                    <td key={`${row.feature}-${index}`} className="px-6 py-4 text-center">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
