import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Luneo - Agents IA pour votre service client',
    short_name: 'Luneo',
    description: 'Déployez des agents IA qui résolvent 80% des demandes clients.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
}
