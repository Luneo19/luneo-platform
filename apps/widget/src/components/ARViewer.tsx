import React from 'react';
import type { Design } from '../types';
import { buildSandboxAttribute } from '../lib/security';
import { cn } from '../lib/utils';

interface ARViewerProps {
  design: Design | null;
  className?: string;
}

const DEFAULT_SANDBOX = buildSandboxAttribute(['allow-orientation-lock']);

export const ARViewer: React.FC<ARViewerProps> = ({ design, className }) => {
  if (!design?.metadata) {
    return (
      <div className={cn('p-6 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg', className)}>
        <p className="font-medium">Prévisualisation AR indisponible</p>
        <p className="text-sm mt-1">Générez un design pour activer la scène AR.</p>
      </div>
    );
  }

  const viewerUrl = typeof design.metadata === 'object' ? (design.metadata as Record<string, unknown>).arUrl : undefined;

  if (!viewerUrl || typeof viewerUrl !== 'string') {
    return (
      <div className={cn('p-6 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-lg', className)}>
        <p className="font-medium">Aucun modèle AR généré</p>
        <p className="text-sm mt-1">Assurez-vous que la génération AR est activée.</p>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full rounded-lg overflow-hidden border border-gray-200', className)}>
      <iframe
        src={viewerUrl}
        title="Luneo AR Preview"
        sandbox={DEFAULT_SANDBOX}
        className="w-full aspect-video"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
