import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle analyzer is a devDependency - only import when ANALYZE is enabled
let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    const bundleAnalyzer = (await import('@next/bundle-analyzer')).default;
    withBundleAnalyzer = bundleAnalyzer({ enabled: true });
  } catch {
    // @next/bundle-analyzer not available (production build without devDependencies)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Note: 'standalone' output is not recommended for Vercel deployments
  // Only use standalone for Docker/Railway deployments
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // Fix monorepo detection
  // Note: outputFileTracingRoot can cause routing issues on Vercel
  // Commented out to let Vercel handle file tracing automatically
  // outputFileTracingRoot: path.join(__dirname, '../..'),
  compress: true,
  poweredByHeader: false,
  // Strict mode enabled only in production (double-renders in dev waste RAM)
  reactStrictMode: process.env.NODE_ENV === 'production',
  
  // Image optimization with CDN support
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // CDN Configuration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      // Cloudflare R2 / Custom CDN
      ...(process.env.NEXT_PUBLIC_CDN_URL && process.env.NEXT_PUBLIC_CDN_URL.startsWith('http') ? [{
        protocol: 'https',
        hostname: (() => { try { return new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname; } catch { return null; } })(),
        pathname: '/**',
      }].filter(p => p.hostname) : []),
    ],
    // Use Cloudinary custom loader if configured (loaderFile only, no built-in loader)
    ...(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && {
      loaderFile: './src/lib/cdn/cloudinary-loader.ts',
    }),
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Experimental features for performance
  experimental: {
    // Disabled for Vercel compatibility
    // optimizeCss: true,
    optimizePackageImports: [
      'lodash',
      'date-fns',
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'framer-motion',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Stub out Sentry and Prisma instrumentation when no DSN is configured
    // to save ~200MB RAM and eliminate "Critical dependency" warnings from @opentelemetry
    if (dev || !process.env.SENTRY_DSN) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sentry/nextjs': false,
        '@sentry/node': false,
        '@prisma/instrumentation': false,
        '@opentelemetry/instrumentation': false,
      };
    }

    // Exclude server-only packages from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        net: false,
        tls: false,
        child_process: false,
      };
      
      // Exclude pdfkit and its dependencies from client bundle (server-only)
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'pdfkit': 'commonjs pdfkit',
          'jpeg-exif': 'commonjs jpeg-exif',
          'png-js': 'commonjs png-js',
        });
      } else {
        config.externals = [
          config.externals,
          {
            'pdfkit': 'commonjs pdfkit',
            'jpeg-exif': 'commonjs jpeg-exif',
            'png-js': 'commonjs png-js',
          }
        ];
      }
      
      // Ignore pdfkit and related modules in client bundle
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(pdfkit|png-js|jpeg-exif)$/,
        })
      );
    }

    // Production optimizations - disabled on Vercel for build performance
    if (!dev && !isServer && !process.env.VERCEL) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
              },
              name(module) {
                const hash = crypto.createHash('sha1');
                hash.update(module.identifier());
                return hash.digest('hex').substring(0, 8);
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            shared: {
              name(module, chunks) {
                return crypto
                  .createHash('sha1')
                  .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                  .digest('hex')
                  .substring(0, 8);
              },
              priority: 10,
              minChunks: 2,
              reuseExistingChunk: true,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
        },
      };
    }

    // Tree shaking optimizations
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    return config;
  },

  // Headers for performance and CDN optimization.
  // Security headers are managed in middleware.ts for dynamic control (nonces, env vars).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Static assets - Long cache with CDN
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Images - CDN optimized
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // Fonts - Long cache
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Manifest - Cache to avoid constant re-fetches
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      // Auth API routes - MUST NEVER be cached (cookies, tokens, session state)
      {
        source: '/api/v1/auth/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'private, no-store',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'private, no-store',
          },
        ],
      },
      // All API routes - Never cache at CDN (dynamic, user-specific data)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'private, no-store',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'private, no-store',
          },
        ],
      },
      // Public assets - Medium cache (covers remaining static files)
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'accept',
            value: '(.*image.*)',
          },
        ],
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  // Rewrites - Handle legacy paths
  async rewrites() {
    return [
      {
        source: '/manifest.webmanifest',
        destination: '/manifest.json',
      },
      {
        source: '/widget.js',
        destination: '/widget/v1/widget.min.js',
      },
    ];
  },

  // Redirects - Éviter les 404
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard',
        destination: '/overview',
        permanent: true,
      },
      {
        source: '/dashboard/:path*',
        destination: '/:path*',
        permanent: true,
      },
      {
        source: '/produit',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/produits',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/solution',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/solutions',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/solutions/:path*',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/industrie',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/industries',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/industries/:path*',
        destination: '/features',
        permanent: true,
      },
      {
        source: '/doc',
        destination: '/help/documentation',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/help/documentation',
        permanent: true,
      },
      {
        source: '/tarifs',
        destination: '/pricing',
        permanent: true,
      },
      {
        source: '/ressources',
        destination: '/resources',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/overview',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);