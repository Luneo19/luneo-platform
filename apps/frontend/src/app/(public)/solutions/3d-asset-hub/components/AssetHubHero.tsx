'use client';

import React from 'react';
import { PageHero } from '@/components/marketing/shared';

export function AssetHubHero() {
  return (
    <PageHero
      title="Gérez Vos Assets 3D"
      description="Uploadez, optimisez, convertissez et déployez vos modèles 3D partout. 1000+ assets/heure avec notre pipeline AI automatisé."
      badge="3D Asset Hub"
      gradient="from-blue-600 via-purple-600 to-green-600"
      cta={{
        label: 'Voir la Démo Interactive',
        href: '#demo-section',
      }}
    />
  );
}
