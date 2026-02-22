'use client';
export function NotAuthenticatedMessage() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Connexion requise</h2>
        <p className="mt-2 text-white/50">Veuillez vous connecter pour acceder a cette page.</p>
        <a href="/login" className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2 text-sm text-white hover:bg-purple-700">Se connecter</a>
      </div>
    </div>
  );
}
