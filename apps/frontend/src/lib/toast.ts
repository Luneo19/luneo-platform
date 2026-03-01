import { toast as sonnerToast } from 'sonner';
import { appRoutes } from '@/lib/routes';

export const toast = {
  success(message: string) {
    sonnerToast.success(message, {
      style: {
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
      },
    });
  },

  error(message: string) {
    sonnerToast.error(message, {
      duration: 5000,
      style: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#991b1b',
      },
    });
  },

  loading(message: string) {
    return sonnerToast.loading(message);
  },

  agentPublished() {
    sonnerToast.success('Agent publié !', {
      description: 'Votre agent est maintenant disponible pour vos clients.',
      action: {
        label: 'Voir',
        onClick: () => {
          window.location.href = appRoutes.agents;
        },
      },
    });
  },
};
