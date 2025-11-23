const messages = {
  locale: {
    code: 'de',
    name: 'Deutsch',
    region: 'Deutschland',
  },
  common: {
    language: 'Sprache',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
  },
  localeSwitcher: {
    label: 'Sprache & Region',
    helper: 'Wählen Sie die Sprache aus, in der Sie die Plattform nutzen möchten.',
  },
  header: {
    searchPlaceholder: 'Designs, Projekte, Kunden suchen...',
    quickActionsLabel: 'Schnellaktionen',
    actions: {
      create: 'Erstellen',
      upgrade: 'Upgrade',
    },
    notifications: {
      title: 'Benachrichtigungen',
      markAll: 'Alle als gelesen markieren',
      viewAll: 'Alle Benachrichtigungen anzeigen',
      ariaLabel: 'Benachrichtigungen ({count} ungelesen)',
      centerAria: 'Benachrichtigungszentrum',
      markReadAria: 'Als gelesen markieren',
      empty: 'Alles erledigt! Neue Aktualisierungen erscheinen hier.',
      items: {
        enterprise: {
          title: 'Neuer Enterprise-Kunde',
          description: '{{company}} hat den Enterprise-Tarif gebucht',
          time: 'Vor 1 Stunde',
        },
        payment: {
          title: 'Zahlung eingegangen',
          description: '{{amount}} von {{customer}}',
          time: 'Vor 3 Stunden',
        },
        quota: {
          title: 'KI-Kontingent fast erreicht',
          description: '{{usage}} Ihres monatlichen Kontingents verbraucht',
          time: 'Vor 5 Stunden',
        },
        maintenance: {
          title: 'Geplante Wartung',
          description: 'Wartung morgen von 02:00 bis 04:00 Uhr (UTC)',
          time: 'Vor 1 Tag',
        },
      },
    },
    profileMenu: {
      openLabel: 'Kontomenü öffnen',
      profile: 'Profil',
      billing: 'Abrechnung',
      settings: 'Einstellungen',
      help: 'Hilfe',
      api: 'API & Integrationen',
      logout: 'Abmelden',
      plan: 'Professional-Tarif',
      welcome: 'Willkommen',
    },
  },
  cookieBanner: {
    title: 'Wir verwenden Cookies',
    description:
      'Wir verwenden Cookies, um Ihre Erfahrung zu verbessern, den Traffic zu analysieren und Inhalte zu personalisieren. Essenzielle Cookies sind für den Betrieb der Website erforderlich. Sie können Ihre Präferenzen anpassen oder alles akzeptieren.',
    learnMore: 'Erfahren Sie mehr in unserer',
    privacyLink: 'Datenschutzerklärung',
    buttons: {
      acceptAll: 'Alle akzeptieren',
      essentialOnly: 'Nur essenzielle',
      customize: 'Anpassen',
      save: 'Präferenzen speichern',
      cancel: 'Abbrechen',
    },
    settingsTitle: 'Cookie-Einstellungen',
    essential: {
      title: 'Essenzielle Cookies',
      badge: 'Verpflichtend',
      description:
        'Erforderlich für den Betrieb der Website (Authentifizierung, Sicherheit, Präferenzen). Diese Cookies können nicht deaktiviert werden.',
    },
    analytics: {
      title: 'Analytics-Cookies',
      description:
        'Helfen uns zu verstehen, wie Sie die Plattform nutzen, damit wir Ihre Erfahrung verbessern können. Daten werden anonymisiert (Vercel Analytics).',
    },
    marketing: {
      title: 'Marketing-Cookies',
      description:
        'Werden verwendet, um Werbung zu personalisieren und die Wirksamkeit unserer Kampagnen zu messen.',
    },
    footer: 'Sie können Ihre Einstellungen jederzeit unter Einstellungen → Datenschutz ändern.',
    closeAria: 'Cookie-Banner schließen',
  },
};

export default messages;

