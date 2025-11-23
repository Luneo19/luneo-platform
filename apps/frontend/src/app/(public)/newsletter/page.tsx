import { Mail } from 'lucide-react';
export const metadata = { title: 'Newsletter - Luneo' };
export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        <Mail className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">Newsletter Luneo</h1>
        <p className="text-gray-600 mb-8">Recevez nos dernières actualités, tutorials, et offres exclusives</p>
        <form className="flex gap-4">
          <input type="email" placeholder="votre@email.com" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">S'abonner</button>
        </form>
        <p className="text-sm text-gray-500 mt-4">Pas de spam. Désabonnement en 1 clic.</p>
      </div>
    </div>
  );
}



