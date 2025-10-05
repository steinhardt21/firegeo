import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { sendEmail } from './email';
import { autumn } from 'autumn-js/better-auth';

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

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL!,
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: getValidBaseURL(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true to require email verification
    sendResetPassword: async ({ user, url }, request) => {
      console.log('Password reset link:', url);
      
      await sendEmail({
        to: user.email,
        subject: 'Reset your password - Fire SaaS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password. Click the button below to create a new password.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
          </div>
        `
      });
    },
  },
  trustedOrigins: [getValidBaseURL()],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session if older than 1 day
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
  emailVerification: {
    sendOnSignUp: false, // Set to true to send verification email on signup
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }, request) => {
      console.log('Verification link:', url);
      
      await sendEmail({
        to: user.email,
        subject: 'Verify your email - Fire SaaS',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p style="color: #666; line-height: 1.6;">
              Thanks for signing up! Please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p style="color: #999; font-size: 14px;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>
        `
      });
    },
  },
  plugins: [autumn()],
});