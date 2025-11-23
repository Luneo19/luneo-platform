const messages = {
  locale: {
    code: 'fr',
    name: 'Français',
    region: 'France',
  },
  common: {
    language: 'Langue',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Enregistrer',
  },
  localeSwitcher: {
    label: 'Langue & région',
    helper: 'Sélectionnez la langue que vous souhaitez utiliser sur la plateforme.',
  },
  header: {
    searchPlaceholder: 'Rechercher des designs, projets, clients...',
    quickActionsLabel: 'Actions rapides',
    actions: {
      create: 'Créer',
      upgrade: 'Upgrade',
    },
    notifications: {
      title: 'Notifications',
      markAll: 'Tout marquer lu',
      viewAll: 'Voir toutes les notifications',
      ariaLabel: 'Notifications ({count} non lues)',
      centerAria: 'Centre de notifications',
      markReadAria: 'Marquer comme lu',
      empty: 'Vous êtes à jour ! Les nouveautés apparaîtront ici.',
      items: {
        enterprise: {
          title: 'Nouveau client Enterprise',
          description: '{{company}} a souscrit au plan Enterprise',
          time: 'Il y a 1h',
        },
        payment: {
          title: 'Paiement reçu',
          description: '{{amount}} de {{customer}}',
          time: 'Il y a 3h',
        },
        quota: {
          title: 'Quota IA atteint',
          description: '{{usage}} de vos générations mensuelles utilisées',
          time: 'Il y a 5h',
        },
        maintenance: {
          title: 'Maintenance programmée',
          description: 'Maintenance prévue demain de 2h à 4h (UTC)',
          time: 'Il y a 1j',
        },
      },
    },
    profileMenu: {
      openLabel: 'Ouvrir le menu compte',
      profile: 'Profil',
      billing: 'Facturation',
      settings: 'Paramètres',
      help: 'Aide',
      api: 'API & Intégrations',
      logout: 'Déconnexion',
      plan: 'Plan Professional',
      welcome: 'Bienvenue',
    },
  },
  cookieBanner: {
    title: '🍪 Nous utilisons des cookies',
    description:
      "Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et personnaliser le contenu. Les cookies essentiels sont nécessaires au fonctionnement du site. Vous pouvez personnaliser vos préférences ou tout accepter.",
    learnMore: 'En savoir plus dans notre',
    privacyLink: 'Politique de Confidentialité',
    buttons: {
      acceptAll: 'Tout Accepter',
      essentialOnly: 'Essentiels Uniquement',
      customize: 'Personnaliser',
      save: 'Enregistrer mes Préférences',
      cancel: 'Annuler',
    },
    settingsTitle: 'Préférences de cookies',
    essential: {
      title: 'Cookies Essentiels',
      badge: 'Obligatoire',
      description:
        "Nécessaires au fonctionnement du site (authentification, sécurité, préférences). Ces cookies ne peuvent pas être désactivés.",
    },
    analytics: {
      title: 'Cookies Analytics',
      description:
        "Nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience. Données anonymisées (Vercel Analytics).",
    },
    marketing: {
      title: 'Cookies Marketing',
      description:
        'Utilisés pour personnaliser les publicités et mesurer l’efficacité de nos campagnes.',
    },
    footer: 'Vous pouvez modifier vos préférences à tout moment depuis Paramètres → Confidentialité',
    closeAria: 'Fermer la bannière cookies',
  },
};

export default messages;

