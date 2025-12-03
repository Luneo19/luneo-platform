import bundleAnalyzer from '@next/bundle-analyzer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  distDir: '.next',
  // Note: i18n configuration is not supported in App Router
  // Use middleware-based internationalization instead
  
  // Moved from experimental (deprecated location)
  // ⚠️ AWS DÉSACTIVÉ - Retiré @aws-sdk/client-s3 (coût: 1200$/mois)
  serverExternalPackages: ['cloudinary'],
  
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true,
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'obrijgptqztacolemsbk.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'], // AVIF first (meilleure compression)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' }
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        process: false,
      };
    }
    
    // Alias pour les packages internes
    config.resolve.alias = {
      ...config.resolve.alias,
      '@luneo/billing-plans': path.resolve(__dirname, 'src/lib/packages/billing-plans/dist'),
    };
    
    // Exclure explicitement les fichiers de test et d'accessibilité du build
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        path.resolve(__dirname, 'src'),
      ],
      exclude: [
        /node_modules/,
        /\.test\.(ts|tsx)$/,
        /\.spec\.(ts|tsx)$/,
        /__tests__/,
        /__a11y__/,
        /\.axe\.(ts|tsx)$/,
        /e2e/,
      ],
    });
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
