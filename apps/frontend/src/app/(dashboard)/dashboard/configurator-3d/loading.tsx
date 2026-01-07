import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-300">Chargement du configurateur 3D...</p>
      </div>
    </div>
  );
}


