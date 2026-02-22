const tokens = require('./src/styles/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: tokens.color['brand-500'],
          foreground: 'hsl(var(--primary-foreground))',
          50: tokens.color['brand-50'],
          100: tokens.color['brand-100'],
          200: tokens.color['brand-200'],
          300: tokens.color['brand-300'],
          400: tokens.color['brand-400'],
          500: tokens.color['brand-500'],
          600: tokens.color['brand-600'],
          700: tokens.color['brand-700'],
          800: tokens.color['brand-800'],
          900: tokens.color['brand-900'],
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: tokens.color.success,
        warning: tokens.color.warning,
        danger: tokens.color.danger,
        neutral: {
          50: tokens.color['neutral-50'],
          100: tokens.color['neutral-100'],
          200: tokens.color['neutral-200'],
          300: tokens.color['neutral-300'],
          400: tokens.color['neutral-400'],
          500: tokens.color['neutral-500'],
          600: tokens.color['neutral-600'],
          700: tokens.color['neutral-700'],
          800: tokens.color['neutral-800'],
          900: tokens.color['neutral-900'],
        },
        // Dark marketing palette
        dark: {
          bg: '#030014',
          card: '#0a0a1a',
          border: '#1a1a3e',
          'border-hover': '#2a2a5e',
          surface: '#0f0f2a',
          accent: '#06b6d4',
        },
        // Premium accent colors (Stripe/Linear inspired)
        indigo: {
          950: '#1e1b4b',
        },
        violet: {
          accent: '#7c3aed',
        },
        cyan: {
          accent: '#06b6d4',
        },
        ai: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          electric: '#3b82f6',
        },
      },
      borderRadius: {
        lg: tokens.radius.lg,
        md: tokens.radius.md,
        sm: tokens.radius.sm,
      },
      spacing: {
        xs: tokens.spacing.xs,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
        lg: tokens.spacing.lg,
        xl: tokens.spacing.xl,
        '2xl': tokens.spacing['2xl'],
        '15': '3.75rem',
        '5.5': '1.375rem',
      },
      zIndex: {
        '999': '999',
        '1000': '1000',
      },
      fontFamily: {
        sans: [tokens.font.family, 'ui-sans-serif', 'system-ui'],
        display: ['var(--font-display)', tokens.font.family, 'ui-sans-serif', 'system-ui'],
        editorial: ['var(--font-editorial)', 'Playfair Display', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        base: tokens.font['size-base'],
        lg: tokens.font['size-lg'],
      },
      fontWeight: {
        regular: tokens.font['weight-regular'],
        medium: tokens.font['weight-medium'],
        bold: tokens.font['weight-bold'],
      },
      boxShadow: {
        sm: tokens.shadow.sm,
        md: tokens.shadow.md,
        lg: tokens.shadow.lg,
        'glow-sm': '0 0 15px rgba(99, 102, 241, 0.15)',
        'glow-md': '0 0 30px rgba(99, 102, 241, 0.2)',
        'glow-lg': '0 0 60px rgba(99, 102, 241, 0.25)',
        'glow-xl': '0 0 80px rgba(99, 102, 241, 0.3), 0 0 120px rgba(124, 58, 237, 0.15)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.2)',
        'glow-purple': '0 0 40px rgba(124, 58, 237, 0.25)',
        'glow-indigo': '0 0 40px rgba(99, 102, 241, 0.25)',
        'glow-cyan': '0 0 40px rgba(6, 182, 212, 0.2)',
        'glow-emerald': '0 0 40px rgba(16, 185, 129, 0.2)',
        'glow-electric': '0 0 40px rgba(59, 130, 246, 0.25)',
        'premium': '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'premium-hover': '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 60px rgba(99, 102, 241, 0.15)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(20px, -30px) rotate(5deg)' },
          '50%': { transform: 'translate(-20px, 20px) rotate(-5deg)' },
          '75%': { transform: 'translate(30px, 10px) rotate(3deg)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-33.333%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'text-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'scan-pulse': {
          '0%': { top: '20%', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { top: '70%', opacity: '0' },
        },
        // Orbiting animation (Madgicx-style)
        'orbit-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Electric grid scan lines
        'electric-scan-h': {
          '0%': { transform: 'translateY(-100vh)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
        'electric-scan-v': {
          '0%': { transform: 'translateX(-100vw)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateX(100vw)', opacity: '0' },
        },
        // Electric node pulse
        'node-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.5)' },
        },
        'ai-gradient-shift': {
          '0%': { backgroundPosition: '0% 50%', filter: 'hue-rotate(0deg)' },
          '33%': { backgroundPosition: '50% 50%', filter: 'hue-rotate(60deg)' },
          '66%': { backgroundPosition: '100% 50%', filter: 'hue-rotate(120deg)' },
          '100%': { backgroundPosition: '0% 50%', filter: 'hue-rotate(0deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-in-out',
        'fade-out': 'fade-out 0.5s ease-in-out',
        'fade-up': 'fade-up 0.6s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.3s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
        'float': 'float 20s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 28s linear infinite',
        'spin-slow': 'spin-slow 40s linear infinite',
        'scale-in': 'scale-in 0.3s ease-out',
        'text-shimmer': 'text-shimmer 4s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'scan-pulse': 'scan-pulse 2.5s ease-in-out infinite',
        'orbit-spin': 'orbit-spin 20s linear infinite',
        'orbit-spin-reverse': 'orbit-spin 20s linear infinite reverse',
        'electric-scan-h': 'electric-scan-h 8s ease-in-out infinite',
        'electric-scan-v': 'electric-scan-v 10s ease-in-out infinite',
        'node-pulse': 'node-pulse 3s ease-in-out infinite',
        'ai-gradient-shift': 'ai-gradient-shift 6s ease infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
