import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { brandAnalyses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/api-errors';

// GET /api/brand-monitor/analyses - Get user's brand analyses
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [ANALYSES API] Starting GET request');
    
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    console.log('🔍 [ANALYSES API] Session response:', {
      hasUser: !!sessionResponse?.user,
      userId: sessionResponse?.user?.id
    });

    if (!sessionResponse?.user) {
      console.log('❌ [ANALYSES API] No user session found');
      throw new AuthenticationError('Please log in to view your analyses');
    }

    console.log('🔍 [ANALYSES API] Attempting to query brandAnalyses table...');
    
    const analyses = await db.query.brandAnalyses.findMany({
      where: eq(brandAnalyses.userId, sessionResponse.user.id),
      orderBy: desc(brandAnalyses.createdAt),
    });

    console.log('✅ [ANALYSES API] Successfully queried analyses:', analyses.length);
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('❌ [ANALYSES API] Error:', error);
    return handleApiError(error);
  }
}

// POST /api/brand-monitor/analyses - Save a new brand analysis
export async function POST(request: NextRequest) {
  try {
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to save analyses');
    }

    const body = await request.json();
    
    if (!body.url || !body.analysisData) {
      throw new ValidationError('Invalid request', {
        url: body.url ? undefined : 'URL is required',
        analysisData: body.analysisData ? undefined : 'Analysis data is required',
      });
    }

    const [analysis] = await db.insert(brandAnalyses).values({
      userId: sessionResponse.user.id,
      url: body.url,
      companyName: body.companyName,
      industry: body.industry,
      analysisData: body.analysisData,
      competitors: body.competitors,
      prompts: body.prompts,
    }).returning();

    return NextResponse.json(analysis);
  } catch (error) {
    return handleApiError(error);
  }
}