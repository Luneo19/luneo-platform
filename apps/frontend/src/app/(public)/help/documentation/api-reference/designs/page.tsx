import Link from 'next/link';

export const metadata = {
  title: 'API Designs - Luneo Documentation',
  description: 'API endpoints pour créer et gérer vos designs',
};

export default function APIDesignsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">API Designs</h1>
        <p className="text-gray-600">Créez et gérez vos designs via l'API</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2>POST /api/v1/designs</h2>
          <p>Crée un nouveau design</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Design',
    template: 't-shirt',
    customizations: {
      color: '#FF0000',
      text: 'Hello World'
    }
  })
})`}</pre>
          </div>
        </section>

        <section className="mb-8">
          <h2>GET /api/v1/designs</h2>
          <p>Liste tous vos designs</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/designs', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`}</pre>
          </div>
        </section>

        <section>
          <h2>GET /api/v1/designs/:id</h2>
          <p>Récupère un design spécifique</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/designs/design_123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
