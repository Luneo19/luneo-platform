import Link from 'next/link';

export const metadata = {
  title: 'API Orders - Luneo Documentation',
  description: 'API endpoints pour gérer les commandes',
};

export default function APIOrdersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/help/documentation" className="text-blue-600 hover:text-blue-700">
          ← Documentation
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">API Orders</h1>
        <p className="text-gray-600">Gérez les commandes de vos clients</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2>POST /api/v1/orders</h2>
          <p>Crée une nouvelle commande</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    designId: 'design_123',
    quantity: 100,
    shipping: {
      name: 'John Doe',
      address: '123 Main St',
      city: 'Paris',
      country: 'FR'
    }
  })
})`}</pre>
          </div>
        </section>

        <section className="mb-8">
          <h2>GET /api/v1/orders/:id</h2>
          <p>Récupère une commande</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/orders/order_123', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
})`}</pre>
          </div>
        </section>

        <section>
          <h2>PATCH /api/v1/orders/:id</h2>
          <p>Met à jour le statut d'une commande</p>
          
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre>{`fetch('https://api.luneo.app/v1/orders/order_123', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'shipped',
    trackingNumber: 'TRACK123'
  })
})`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
