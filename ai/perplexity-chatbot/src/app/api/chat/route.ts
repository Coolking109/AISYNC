import { NextRequest, NextResponse } from 'next/server';
import { MultiModelAI } from '@/lib/multi-model-ai';
import { ChatMessage } from '@/lib/types';

// Note: Removed edge runtime to fix build issues with AI SDKs


// Force dynamic rendering for this API route

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    // Debug: Check for attachments
    messages?.forEach((msg, i) => {
      if (msg.attachments && msg.attachments.length > 0) {
        console.log(`Chat API: Message ${i} has ${msg.attachments.length} attachments:`, 
          msg.attachments.map(att => `${att.name} (${att.type})`));
      }
    });

    if (!messages || messages.length === 0) {
      console.log('Chat API: No messages provided');
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      );
    }

    console.log('Chat API: Initializing MultiModelAI...');
    const multiModelAI = new MultiModelAI();
    
    let result;
    
    // Add timeout wrapper for AI operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI request timeout')), 45000)
    );
    
    if (modelSelection?.mode === 'single' && modelSelection.selectedModel) {
      console.log('Chat API: Querying single model:', modelSelection.selectedModel);
      result = await Promise.race([
        multiModelAI.querySingleModel(messages, modelSelection.selectedModel, userLanguage),
        timeoutPromise
      ]);
    } else {
      console.log('Chat API: Querying all models...');
      result = await Promise.race([
        multiModelAI.queryAllModels(messages, userLanguage),
        timeoutPromise
      ]);
    }
    
    console.log('Chat API: Got result with', result.responses?.length || 0, 'responses');
    console.log('Chat API: Aggregated response length:', result.aggregatedResponse?.length || 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle timeout specifically
    if (error instanceof Error && error.message === 'AI request timeout') {
      return NextResponse.json(
        { 
          error: 'Request timeout - AI models are taking too long to respond. Please try a shorter message or try again later.',
          timeout: true
        },
        { status: 504 }
      );
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
