import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function NotFoundContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6">
          <span className="text-white font-bold text-2xl">L</span>
        </div>

        {/* 404 */}
        <h1 className="text-9xl font-bold text-gray-200 mb-4">404</h1>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Page non trouvée
        </h2>
        
        {/* Description */}
        <p className="text-gray-600 mb-8">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <button className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Retour à l'accueil
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <ErrorBoundary componentName="NotFound">
      <NotFoundContent />
    </ErrorBoundary>
  );
}