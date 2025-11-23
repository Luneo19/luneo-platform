import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Error Handling - Luneo Documentation',
};

export default function ErrorsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">← Documentation</Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <AlertTriangle className="w-10 h-10 text-red-600" />
          <h1 className="text-4xl font-bold">Error Handling</h1>
        </div>
        <p className="text-xl text-gray-600">Guide de gestion des erreurs</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Error Codes</h2>
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Code</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-mono text-sm">400</td>
                <td className="px-4 py-3">Bad Request - Paramètres invalides</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm">401</td>
                <td className="px-4 py-3">Unauthorized - API key invalide</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm">403</td>
                <td className="px-4 py-3">Forbidden - Accès refusé</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm">404</td>
                <td className="px-4 py-3">Not Found - Ressource introuvable</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm">429</td>
                <td className="px-4 py-3">Rate Limit Exceeded</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-sm">500</td>
                <td className="px-4 py-3">Server Error - Erreur interne</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Error Response Format</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`{
  "error": {
    "code": "invalid_request",
    "message": "Missing required parameter: template",
    "param": "template"
  }
}`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}



