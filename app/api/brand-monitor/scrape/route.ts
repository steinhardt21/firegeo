import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { scrapeCompanyInfo } from '@/lib/scrape-utils';
import { 
  handleApiError, 
  AuthenticationError, 
  ValidationError
} from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to use this feature');
    }

    console.log('[Brand Monitor Scrape] User authenticated:', sessionResponse.user.id);

    const { url, maxAge } = await request.json();

    if (!url) {
      throw new ValidationError('Invalid request', {
        url: 'URL is required'
      });
    }
    
    // Ensure URL has protocol
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    console.log('[Brand Monitor Scrape] Scraping URL:', normalizedUrl);
    const company = await scrapeCompanyInfo(normalizedUrl, maxAge);

    return NextResponse.json({ company });
  } catch (error) {
    return handleApiError(error);
  }
}
