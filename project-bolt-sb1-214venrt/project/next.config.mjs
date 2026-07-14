/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
  },
];

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Pre-existing unused-var warnings in canvas utilities must not block SEO deploys
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  outputFileTracingRoot: process.cwd(),
  webpack: (config, { dev, webpack }) => {
    // Vite-era import.meta.env.* used across src — map for Next bundles
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env.DEV': JSON.stringify(dev),
        'import.meta.env.PROD': JSON.stringify(!dev),
        'import.meta.env.MODE': JSON.stringify(dev ? 'development' : 'production'),
        'import.meta.env.VITE_GA4_MEASUREMENT_ID': JSON.stringify(
          process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ||
            process.env.VITE_GA4_MEASUREMENT_ID ||
            '',
        ),
        'import.meta.env.VITE_GSC_VERIFICATION': JSON.stringify(
          process.env.NEXT_PUBLIC_GSC_VERIFICATION ||
            process.env.VITE_GSC_VERIFICATION ||
            '',
        ),
        'import.meta.env.VITE_BING_VERIFICATION': JSON.stringify(
          process.env.NEXT_PUBLIC_BING_VERIFICATION ||
            process.env.VITE_BING_VERIFICATION ||
            '',
        ),
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
          process.env.NEXT_PUBLIC_SUPABASE_URL ||
            process.env.VITE_SUPABASE_URL ||
            '',
        ),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.VITE_SUPABASE_ANON_KEY ||
            '',
        ),
      }),
    );

    config.module.rules.push({
      test: /pdf\.worker\.min\.mjs$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
