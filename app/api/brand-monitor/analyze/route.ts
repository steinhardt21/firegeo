import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { performAnalysis, createSSEMessage } from '@/lib/analyze-common';
import { SSEEvent } from '@/lib/types';
import { 
  AuthenticationError, 
  ValidationError, 
  ExternalServiceError, 
  handleApiError 
} from '@/lib/api-errors';
import { 
  ERROR_MESSAGES,
  SSE_MAX_DURATION
} from '@/config/constants';

export const runtime = 'nodejs'; // Use Node.js runtime for streaming
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    // Get the session
    const sessionResponse = await auth.api.getSession({
      headers: request.headers,
    });

    if (!sessionResponse?.user) {
      throw new AuthenticationError('Please log in to use brand monitor');
    }

    console.log('[Brand Monitor] User authenticated:', sessionResponse.user.id);

    const { company, prompts: customPrompts, competitors: userSelectedCompetitors, useWebSearch = false } = await request.json();

    if (!company || !company.name) {
      throw new ValidationError(ERROR_MESSAGES.COMPANY_INFO_REQUIRED, {
        company: 'Company name is required'
      });
    }

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Brand Monitor] Starting analysis for:', company.name);

          // Send initial status
          const startMessage = createSSEMessage(SSEEvent.ANALYSIS_START, {
            message: 'Starting analysis...',
            company: company.name,
          });
          controller.enqueue(encoder.encode(startMessage));

          // Perform the analysis with SSE updates
          await performAnalysis({
            company,
            userId: sessionResponse.user.id,
            customPrompts,
            userSelectedCompetitors,
            useWebSearch,
            onUpdate: (event: SSEEvent, data: any) => {
              const message = createSSEMessage(event, data);
              controller.enqueue(encoder.encode(message));
            },
          });

          // Send completion message
          const completeMessage = createSSEMessage(SSEEvent.ANALYSIS_COMPLETE, {
            message: 'Analysis complete',
          });
          controller.enqueue(encoder.encode(completeMessage));

          console.log('[Brand Monitor] Analysis completed successfully');
        } catch (error) {
          console.error('[Brand Monitor] Analysis error:', error);
          const errorMessage = createSSEMessage(SSEEvent.ERROR, {
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
          controller.enqueue(encoder.encode(errorMessage));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Brand Monitor] Request error:', error);
    return handleApiError(error);
  }
}
