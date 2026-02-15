'use client';

import React, { useEffect, memo } from 'react';
import { logger } from '@/lib/logger';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

interface CrispChatProps {
  websiteId?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Composant d'intégration du chat Crisp
 * 
 * Configuration via:
 * - Variable d'environnement NEXT_PUBLIC_CRISP_WEBSITE_ID
 * - Ou prop websiteId
 * 
 * Usage:
 * <CrispChat userEmail="user@example.com" userName="John Doe" />
 */
function CrispChatContent({ websiteId, userEmail, userName }: CrispChatProps) {
  useEffect(() => {
    const crispId = websiteId || process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;
    
    if (!crispId) {
      logger.warn('Crisp website ID not configured');
      return;
    }

    // Initialisation Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = crispId;

    // Charger le script Crisp
    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Configurer les données utilisateur si disponibles
    script.onload = () => {
      if (window.$crisp) {
        // Masquer par défaut sur mobile
        window.$crisp.push(['set', 'session:hide_on_mobile', true]);
        
        // Définir les informations utilisateur
        if (userEmail) {
          window.$crisp.push(['set', 'user:email', userEmail]);
        }
        if (userName) {
          window.$crisp.push(['set', 'user:nickname', userName]);
        }

        // Couleur personnalisée
        window.$crisp.push(['set', 'color', '#0891b2']); // Cyan
        
        logger.info('Crisp chat initialized');
      }
    };

    // Nettoyage
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [websiteId, userEmail, userName]);

  return null;
}

const CrispChatContentMemo = memo(CrispChatContent);

export function CrispChat(props: CrispChatProps) {
  return <CrispChatContentMemo {...props} />;
}

/**
 * Utilitaires pour contrôler le chat Crisp
 */
export const CrispUtils = {
  // Ouvrir le chat
  open: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:open']);
    }
  },

  // Fermer le chat
  close: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:close']);
    }
  },

  // Afficher le chat
  show: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:show']);
    }
  },

  // Masquer le chat
  hide: () => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'chat:hide']);
    }
  },

  // Envoyer un message automatique
  sendMessage: (message: string) => {
    if (window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]]);
    }
  },

  // Définir les segments utilisateur
  setSegments: (segments: string[]) => {
    if (window.$crisp) {
      window.$crisp.push(['set', 'session:segments', segments]);
    }
  },

  // Définir des données personnalisées
  setData: (key: string, value: string | number | boolean) => {
    if (window.$crisp) {
      window.$crisp.push(['set', `session:data:${key}`, value]);
    }
  },
};

export default CrispChat;

