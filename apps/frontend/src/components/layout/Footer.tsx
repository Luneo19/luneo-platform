import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Luneo</h3>
            <p className="text-sm text-gray-600">
              Plateforme AI de création de designs pour les marques de luxe.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Produit</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="text-gray-600 hover:text-gray-900">Tarifs</Link></li>
              <li><Link href="/overview" className="text-gray-600 hover:text-gray-900">Dashboard</Link></li>
              <li><Link href="/ai-studio" className="text-gray-600 hover:text-gray-900">AI Studio</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="text-gray-600 hover:text-gray-900">Aide</Link></li>
              <li><Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link></li>
              <li><Link href="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Légal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="text-gray-600 hover:text-gray-900">CGU</Link></li>
              <li><Link href="/legal/privacy" className="text-gray-600 hover:text-gray-900">Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © {new Date().getFullYear()} Luneo. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

