import { createAuthClient } from 'better-auth/react';

// Helper function to get a valid base URL (same logic as auth.ts)
const getValidBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  console.log('🔍 [AUTH CLIENT] Environment Debug:', {
    NEXT_PUBLIC_APP_URL: envUrl,
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
    typeof_window: typeof window,
    window_location: typeof window !== 'undefined' ? window.location?.origin : 'N/A'
  });
  
  // Check if we have a valid URL
  const isValidUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') {
      console.log('❌ [AUTH CLIENT] URL is undefined or not string:', url);
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
      console.log('❌ [AUTH CLIENT] Rejected invalid URL:', JSON.stringify(url));
      return false;
    }
    
    // Detect Railway template variables (not actual URLs during build)
    if (url.includes('${{') || url.includes('}}')) {
      console.log('🚂 [AUTH CLIENT] Detected Railway template variable:', url);
      return false;
    }
    
    try {
      const parsed = new URL(url);
      const isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      console.log('✅ [AUTH CLIENT] URL validation result:', url, 'valid:', isValid);
      return isValid;
    } catch (error) {
      console.log('❌ [AUTH CLIENT] URL parsing failed:', url, error.message);
      return false;
    }
  };
  
  // If we're in the browser and have a valid current origin, use that instead of env vars
  if (typeof window !== 'undefined' && window.location) {
    const currentOrigin = window.location.origin;
    console.log('🌐 [AUTH CLIENT] Browser detected, current origin:', currentOrigin);
    
    // Use current origin if it's not localhost or if we're in development
    if (currentOrigin && (process.env.NODE_ENV === 'development' || currentOrigin !== 'http://localhost:3000')) {
      console.log('🎯 [AUTH CLIENT] Using browser origin:', currentOrigin);
      return currentOrigin;
    }
  }
  
  // Use NEXT_PUBLIC_APP_URL if valid
  if (isValidUrl(envUrl)) {
    console.log('🎯 [AUTH CLIENT] Using NEXT_PUBLIC_APP_URL:', envUrl);
    return envUrl!;
  }
  
  // During build time on Railway or production, use a safe placeholder
  if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    console.log('🚂 [AUTH CLIENT] Using Railway placeholder URL');
    return 'https://placeholder.railway.app';
  }
  
  console.log('🏠 [AUTH CLIENT] Using localhost fallback');
  return 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getValidBaseURL(),
  fetchOptions: {
    credentials: 'include',
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession
} = authClient;