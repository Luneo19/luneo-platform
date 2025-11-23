import Link from 'next/link';
import { Key } from 'lucide-react';

export const metadata = {
  title: 'Authentication - Luneo Documentation',
  description: 'Guide d\'authentification API Luneo',
};

export default function AuthenticationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <div className="flex items-center gap-3 mt-4 mb-2">
          <Key className="w-10 h-10 text-blue-600" />
          <h1 className="text-4xl font-bold">Authentication</h1>
        </div>
        <p className="text-xl text-gray-600">Sécurisez vos appels API avec tokens JWT</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">API Keys</h2>
          <p className="text-gray-700 mb-4">
            Luneo utilise des API keys pour authentifier les requêtes. Générez vos clés dans le dashboard.
          </p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4">
            <pre>{`// Ajoutez votre API key dans l'header Authorization
Authorization: Bearer YOUR_API_KEY

// Example avec fetch
fetch('https://api.luneo.app/v1/designs', {
  headers: {
    'Authorization': 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  }
})`}</pre>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-semibold text-yellow-900">⚠️ Sécurité</p>
            <ul className="mt-2 text-yellow-800 space-y-1">
              <li>Ne commitez JAMAIS vos API keys dans Git</li>
              <li>Utilisez des variables d'environnement</li>
              <li>Régénérez les clés compromises immédiatement</li>
            </ul>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">JWT Tokens</h2>
          <p className="text-gray-700 mb-4">
            Pour les applications frontend, utilisez JWT tokens avec refresh automatique.
          </p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
            <pre>{`// Login
const { accessToken, refreshToken } = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
}).then(r => r.json());

// Utiliser le token
fetch('https://api.luneo.app/v1/designs', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`
  }
});

// Refresh automatique
if (tokenExpired) {
  const newToken = await fetch('/api/auth/refresh', {
    headers: { 'Authorization': \`Bearer \${refreshToken}\` }
  }).then(r => r.json());
}`}</pre>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-6">Rate Limiting</h2>
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Rate Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3">Starter</td>
                <td className="px-4 py-3">100 req/min</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Professional</td>
                <td className="px-4 py-3">1000 req/min</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Business</td>
                <td className="px-4 py-3">5000 req/min</td>
              </tr>
              <tr>
                <td className="px-4 py-3">Enterprise</td>
                <td className="px-4 py-3">Illimité</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}



