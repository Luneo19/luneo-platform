import bundleAnalyzer from '@next/bundle-analyzer';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
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
  reactStrictMode: true,
  
  // Image optimization with CDN support
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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
      // Cloudflare R2 / Custom CDN
      ...(process.env.NEXT_PUBLIC_CDN_URL ? [{
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_CDN_URL).hostname,
        pathname: '/**',
      }] : []),
    ],
    // Use Cloudinary loader if configured
    ...(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME && {
      loader: 'cloudinary',
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
    optimizeCss: true,
    optimizePackageImports: [
      '@nivo/line',
      '@nivo/bar',
      '@nivo/pie',
      '@nivo/core',
      'framer-motion',
      'lodash',
      'date-fns',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'react-chartjs-2',
      'chart.js',
    ],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
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

    // Production optimizations
    if (!dev && !isServer) {
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

  // Headers for security, performance, and CDN optimization
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
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
      // API routes - Short cache with revalidation
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      // Public assets - Medium cache
      {
        source: '/(.*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2|ttf|eot))',
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

  // Redirects - Éviter les 404
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/produit',
        destination: '/produits',
        permanent: true,
      },
      {
        source: '/solution',
        destination: '/solutions',
        permanent: true,
      },
      {
        source: '/industrie',
        destination: '/industries',
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
        source: '/features',
        destination: '/solutions',
        permanent: true,
      },
      {
        source: '/app',
        destination: '/dashboard',
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