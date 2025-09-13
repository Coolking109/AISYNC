import { NextRequest, NextResponse } from 'next/server';
import { MultiModelAI } from '@/lib/multi-model-ai';
import { ChatMessage } from '@/lib/types';

// Optimized for Vercel serverless functions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30; // Vercel Pro limit

export async function POST(request: NextRequest) {
  try {
    console.log('Chat API: Received request');
    
    const { messages, modelSelection, userLanguage }: { 
      messages: ChatMessage[], 
      modelSelection?: { mode: 'all' | 'single', selectedModel?: string },
      userLanguage?: string
    } = await request.json();
    
    console.log('Chat API: Parsed messages:', messages?.length || 0, 'messages');
    console.log('Chat API: Model selection:', modelSelection);
    console.log('Chat API: User language:', userLanguage);
    
    // Validate input
    if (!messages || messages.length === 0) {
      console.log('Chat API: No messages provided');
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    // Limit message history to prevent memory issues in Vercel
    const recentMessages = messages.slice(-10); // Only keep last 10 messages
    
    // Debug: Check for attachments
    recentMessages?.forEach((msg, i) => {
      if (msg.attachments && msg.attachments.length > 0) {
        console.log(`Chat API: Message ${i} has ${msg.attachments.length} attachments:`, 
          msg.attachments.map(att => `${att.name} (${att.type})`));
      }
    });

    console.log('Chat API: Initializing MultiModelAI...');
    const multiModelAI = new MultiModelAI();
    
    let result;
    
    // Optimized timeout for Vercel (22 seconds to stay within 30s limit)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 22000)
    );
    
    if (modelSelection?.mode === 'single' && modelSelection.selectedModel) {
      console.log('Chat API: Querying single model:', modelSelection.selectedModel);
      result = await Promise.race([
        multiModelAI.querySingleModel(recentMessages, modelSelection.selectedModel, userLanguage),
        timeoutPromise
      ]);
    } else {
      console.log('Chat API: Querying all models...');
      result = await Promise.race([
        multiModelAI.queryAllModels(recentMessages, userLanguage),
        timeoutPromise
      ]);
    }
    
    console.log('Chat API: Got result with', result.responses?.length || 0, 'responses');
    console.log('Chat API: Aggregated response length:', result.aggregatedResponse?.length || 0);

    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle different error types for better user experience
    if (error instanceof Error) {
      if (error.message === 'AI request timeout') {
        return NextResponse.json(
          { 
            error: 'Request timeout - AI models are taking too long to respond. Please try a shorter message or try again later.',
            timeout: true
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded. Please wait a moment before trying again.',
            rateLimit: true
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { 
            error: 'API quota exceeded. Please check your API credits.',
            quota: true
          },
          { status: 429 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
