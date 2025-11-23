import { Mail, MessageCircle, Phone, Clock } from 'lucide-react';

export const metadata = {
  title: 'Support - Luneo',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Support</h1>
          <p className="text-xl text-green-100">Notre équipe est là pour vous aider</p>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Mail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Email Support</h3>
            <p className="text-gray-600 mb-4">support@luneo.app</p>
            <p className="text-sm text-gray-500">Réponse sous 24h</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Live Chat</h3>
            <p className="text-gray-600 mb-4">Chat en direct</p>
            <p className="text-sm text-gray-500">Lun-Ven 9h-18h</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Phone className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-2">Téléphone</h3>
            <p className="text-gray-600 mb-4">+33 1 XX XX XX XX</p>
            <p className="text-sm text-gray-500">Enterprise uniquement</p>
          </div>
        </div>

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            Heures d'ouverture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Support Email</h3>
              <p className="text-gray-600">24/7 - Réponse sous 24h</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Live Chat & Téléphone</h3>
              <p className="text-gray-600">Lun-Ven: 9h00 - 18h00 (CET)</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



