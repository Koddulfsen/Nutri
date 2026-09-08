// Refuse to produce a production build with the dev auth bypass enabled.
//
// DEV_AUTH_BYPASS makes every anonymous request a fixed admin with unrestricted
// read/write on every table, accepts any password at the login form, and makes
// logout and session revocation impossible. The runtime guards in
// lib/supabase/dev-user.ts and middleware.ts already refuse it in production;
// this fails the build loudly rather than shipping something that silently
// depends on those guards holding.
if (
  process.env.NODE_ENV === 'production' &&
  (process.env.DEV_AUTH_BYPASS === 'true' ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true')
) {
  throw new Error(
    'Refusing to build: DEV_AUTH_BYPASS is enabled in a production build. ' +
      'It grants every anonymous visitor full admin access. ' +
      'Unset DEV_AUTH_BYPASS and NEXT_PUBLIC_DEV_AUTH_BYPASS before building.'
  );
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Serve under /nutri subpath on sana.eco
  basePath: '/nutri',

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // Experimental features for Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
