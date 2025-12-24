/**
 * Dynamic Chart Components
 * Optimized lazy loading for heavy chart libraries
 */

import dynamic from 'next/dynamic';

// @nivo charts (heavy: ~240KB total)
export const LazyResponsiveLine = dynamic(
  () => import('@nivo/line').then(mod => mod.ResponsiveLine),
  { ssr: false }
);

export const LazyResponsiveBar = dynamic(
  () => import('@nivo/bar').then(mod => mod.ResponsiveBar),
  { ssr: false }
);

export const LazyResponsivePie = dynamic(
  () => import('@nivo/pie').then(mod => mod.ResponsivePie),
  { ssr: false }
);

// Recharts (heavy: ~120KB)
export const LazyLineChart = dynamic(
  () => import('recharts').then(mod => mod.LineChart),
  { ssr: false }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then(mod => mod.BarChart),
  { ssr: false }
);

export const LazyPieChart = dynamic(
  () => import('recharts').then(mod => mod.PieChart),
  { ssr: false }
);

