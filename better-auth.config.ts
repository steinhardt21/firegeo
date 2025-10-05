import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables for CLI
dotenv.config({ path: '.env.local' });

// Helper function to get a valid base URL
const getValidBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Debug logging to see what Railway is passing
  console.log('🔍 Config URL Debug - NEXT_PUBLIC_APP_URL:', JSON.stringify(envUrl));
  console.log('🔍 Config URL Debug - NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 Config URL Debug - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
  
  // Check if we have a valid URL
  const isValidUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') {
      console.log('❌ Config URL is undefined or not string:', url);
      return false;
    }
    
    // Reject obviously invalid URLs - be more comprehensive
    if (!url || 
        url === 'https://' || 
        url === 'http://' || 
        url === 'https:' || 
        url === 'http:' || 
        url === 'https://.' ||  // Railway specific issue
        url === 'http://.' ||
        url.endsWith('/.') ||   // Malformed URLs ending with /.
        url.length < 10) {
      console.log('❌ Config Rejected invalid URL:', JSON.stringify(url));
      return false;
    }
    
    // Detect Railway template variables (not actual URLs during build)
    if (url.includes('${{') || url.includes('}}')) {
      console.log('🚂 Config Detected Railway template variable:', url);
      return false;
    }
    
    try {
      const parsed = new URL(url);
      const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      console.log('✅ Config URL validation result:', url, 'valid:', isValid);
      return isValid;
    } catch (error) {
      console.log('❌ Config URL parsing failed:', url, error.message);
      return false;
    }
  };
  
  // Use NEXT_PUBLIC_APP_URL if valid
  if (isValidUrl(envUrl)) {
    console.log('🎯 Config Using NEXT_PUBLIC_APP_URL:', envUrl);
    return envUrl!;
  }
  
  // During build time on Railway or production, use a safe placeholder
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    console.log('🚂 Config Using Railway placeholder URL');
    return 'https://placeholder.railway.app';
  }
  
  console.log('🏠 Config Using localhost fallback');
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
