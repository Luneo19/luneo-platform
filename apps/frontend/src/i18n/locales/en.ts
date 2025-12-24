const messages = {
  locale: {
    code: 'en',
    name: 'English',
    region: 'United States',
  },
  common: {
    language: 'Language',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
  },
  localeSwitcher: {
    label: 'Language & region',
    helper: 'Select your preferred language for the platform.',
  },
  header: {
    searchPlaceholder: 'Search designs, projects, clients...',
    quickActionsLabel: 'Quick actions',
    actions: {
      create: 'Create',
      upgrade: 'Upgrade',
    },
    notifications: {
      title: 'Notifications',
      markAll: 'Mark all read',
      viewAll: 'View all notifications',
      ariaLabel: 'Notifications ({count} unread)',
      centerAria: 'Notification center',
      markReadAria: 'Mark as read',
      empty: 'You are up to date! New updates will appear here.',
      items: {
        enterprise: {
          title: 'New enterprise customer',
          description: '{{company}} subscribed to the Enterprise plan',
          time: '1 hour ago',
        },
        payment: {
          title: 'Payment received',
          description: '{{amount}} from {{customer}}',
          time: '3 hours ago',
        },
        quota: {
          title: 'AI quota almost reached',
          description: '{{usage}} of your monthly generations used',
          time: '5 hours ago',
        },
        maintenance: {
          title: 'Scheduled maintenance',
          description: 'Maintenance tomorrow from 2:00 AM to 4:00 AM (UTC)',
          time: '1 day ago',
        },
      },
    },
    profileMenu: {
      openLabel: 'Open account menu',
      profile: 'Profile',
      billing: 'Billing',
      settings: 'Settings',
      help: 'Help center',
      api: 'API & Integrations',
      logout: 'Sign out',
      plan: 'Professional plan',
      welcome: 'Welcome',
    },
  },
  cookieBanner: {
    title: 'We use cookies',
    description:
      'We use cookies to improve your experience, analyse traffic, and personalise content. Essential cookies are required for the site to function. You can customise your preferences or accept all.',
    learnMore: 'Learn more in our',
    privacyLink: 'Privacy Policy',
    buttons: {
      acceptAll: 'Accept all',
      essentialOnly: 'Essential only',
      customize: 'Customise',
      save: 'Save my preferences',
      cancel: 'Cancel',
    },
    settingsTitle: 'Cookie preferences',
    essential: {
      title: 'Essential cookies',
      badge: 'Required',
      description:
        'Required for the site to work (authentication, security, preferences). These cookies cannot be disabled.',
    },
    analytics: {
      title: 'Analytics cookies',
      description:
        'Help us understand how you use the platform so we can enhance your experience. Data is anonymised (Vercel Analytics).',
    },
    marketing: {
      title: 'Marketing cookies',
      description: 'Used to personalise ads and measure the effectiveness of our campaigns.',
    },
    footer: 'You can update your preferences at any time via Settings → Privacy',
    closeAria: 'Dismiss cookie banner',
  },
};

export default messages;

