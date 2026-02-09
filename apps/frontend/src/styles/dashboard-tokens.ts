// =============================================================================
// DASHBOARD DESIGN SYSTEM - Dark Glassmorphism Tokens
// Inspired by madgicx.com - Premium SaaS dashboard aesthetic
// =============================================================================

export const dashboardColors = {
  // Backgrounds (darkest to lightest)
  bg: {
    primary: '#0a0a0f',      // Main background
    secondary: '#0e0e16',    // Slightly lighter
    tertiary: '#12121a',     // Cards base
    elevated: '#16161f',     // Elevated surfaces
    surface: '#1a1a2e',      // Interactive surfaces
    hover: '#1e1e32',        // Hover states
    active: '#22223a',       // Active/pressed states
  },

  // Glass effects
  glass: {
    card: 'rgba(255, 255, 255, 0.03)',
    cardHover: 'rgba(255, 255, 255, 0.06)',
    cardActive: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.06)',
    borderHover: 'rgba(255, 255, 255, 0.10)',
    borderActive: 'rgba(255, 255, 255, 0.15)',
    sidebar: 'rgba(255, 255, 255, 0.02)',
    header: 'rgba(10, 10, 15, 0.85)',
    overlay: 'rgba(0, 0, 0, 0.60)',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a1a1b5',
    tertiary: '#6b6b80',
    muted: '#4a4a5e',
    inverse: '#0a0a0f',
    accent: '#c084fc',        // Purple accent text
    success: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',
  },

  // Accent gradients
  accent: {
    purple: {
      from: '#8b5cf6',
      to: '#a855f7',
      glow: 'rgba(139, 92, 246, 0.3)',
    },
    pink: {
      from: '#ec4899',
      to: '#f472b6',
      glow: 'rgba(236, 72, 153, 0.3)',
    },
    purplePink: {
      from: '#8b5cf6',
      via: '#a855f7',
      to: '#ec4899',
    },
    blue: {
      from: '#3b82f6',
      to: '#60a5fa',
      glow: 'rgba(59, 130, 246, 0.3)',
    },
  },

  // Semantic
  status: {
    success: { bg: 'rgba(74, 222, 128, 0.10)', text: '#4ade80', border: 'rgba(74, 222, 128, 0.20)' },
    warning: { bg: 'rgba(251, 191, 36, 0.10)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.20)' },
    danger: { bg: 'rgba(248, 113, 113, 0.10)', text: '#f87171', border: 'rgba(248, 113, 113, 0.20)' },
    info: { bg: 'rgba(96, 165, 250, 0.10)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.20)' },
    neutral: { bg: 'rgba(161, 161, 181, 0.10)', text: '#a1a1b5', border: 'rgba(161, 161, 181, 0.20)' },
  },

  // Plan badges
  plans: {
    free: { bg: 'rgba(161, 161, 181, 0.15)', text: '#a1a1b5', border: 'rgba(161, 161, 181, 0.25)' },
    starter: { bg: 'rgba(96, 165, 250, 0.15)', text: '#60a5fa', border: 'rgba(96, 165, 250, 0.25)' },
    professional: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.25)' },
    enterprise: { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.25)' },
  },
} as const;

// Chart color palette - 8 colors for data visualization
export const chartColors = [
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#f97316', // Orange
] as const;

// Chart gradient fills
export const chartGradients = {
  purple: { from: 'rgba(139, 92, 246, 0.3)', to: 'rgba(139, 92, 246, 0.0)' },
  pink: { from: 'rgba(236, 72, 153, 0.3)', to: 'rgba(236, 72, 153, 0.0)' },
  blue: { from: 'rgba(59, 130, 246, 0.3)', to: 'rgba(59, 130, 246, 0.0)' },
  emerald: { from: 'rgba(16, 185, 129, 0.3)', to: 'rgba(16, 185, 129, 0.0)' },
} as const;

// Recharts dark theme config
export const rechartsTheme = {
  backgroundColor: 'transparent',
  textColor: '#6b6b80',
  gridColor: 'rgba(255, 255, 255, 0.04)',
  tooltipBg: '#1a1a2e',
  tooltipBorder: 'rgba(255, 255, 255, 0.08)',
  cursorColor: 'rgba(139, 92, 246, 0.2)',
  axisColor: '#4a4a5e',
} as const;

// Density system
export const densityConfig = {
  compact: {
    gap: '0.5rem',
    padding: '0.75rem',
    cardPadding: '1rem',
    fontSize: '0.8125rem',
    lineHeight: '1.25rem',
    iconSize: '1rem',
    rowHeight: '2.25rem',
  },
  comfort: {
    gap: '0.75rem',
    padding: '1rem',
    cardPadding: '1.5rem',
    fontSize: '0.875rem',
    lineHeight: '1.375rem',
    iconSize: '1.125rem',
    rowHeight: '2.75rem',
  },
  spacious: {
    gap: '1rem',
    padding: '1.5rem',
    cardPadding: '2rem',
    fontSize: '0.9375rem',
    lineHeight: '1.5rem',
    iconSize: '1.25rem',
    rowHeight: '3.25rem',
  },
} as const;

export type DensityMode = keyof typeof densityConfig;

// Sidebar dimensions
export const sidebarConfig = {
  expandedWidth: 260,
  collapsedWidth: 72,
  transitionDuration: 300,
} as const;
