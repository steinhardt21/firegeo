import { createAuthClient } from 'better-auth/react';

// Helper function to get a valid base URL (same logic as auth.ts)
const getValidBaseURL = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // Check if we have a valid URL
  const isValidUrl = (url: string | undefined) => {
    if (!url || typeof url !== 'string') return false;
    
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