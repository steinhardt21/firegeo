import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables for CLI
dotenv.config({ path: '.env.local' });

// Helper function to get a valid base URL
const getValidBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Check if we have a valid URL
  const isValidUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') return false;
    
    // Reject obviously invalid URLs
    if (url === 'https://' || url === 'http://' || url.length < 10) {
      return false;
    }
    
    // Detect Railway template variables (not actual URLs during build)
    if (url.includes('${{') || url.includes('}}')) {
      return false;
    }
    
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };
  
  // Use NEXT_PUBLIC_APP_URL if valid
  if (isValidUrl(envUrl)) {
    return envUrl!;
  }
  
  // During build time on Railway or production, use a safe placeholder
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    return 'https://placeholder.railway.app';
  }
  
  return 'http://localhost:3000';
};

const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  NEXT_PUBLIC_APP_URL: getValidBaseURL(),
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL,
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production',
      path: '/',
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: env.NODE_ENV === 'production',
    },
  },
});
