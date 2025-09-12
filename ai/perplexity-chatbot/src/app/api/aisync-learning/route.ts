import { NextRequest, NextResponse } from 'next/server';
import { AISyncSelfLearning } from '../../../lib/ai-self-learning';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function POST(request: NextRequest) {
  try {
    console.log('🧠 AISync Self-Learning API endpoint called');
    
    const { action, config } = await request.json();

    switch (action) {
      case 'start-session':
        console.log('🚀 Starting AISync self-learning session...');
        
        // Prepare learning configuration
        let learningConfig = {};
        if (config?.maxQuestions) {
          console.log(`🧪 Test mode: ${config.maxQuestions} questions only`);
          learningConfig = { maxQuestionsPerSession: config.maxQuestions };
        }
        
        const sessionId = await AISyncSelfLearning.startSelfLearningSession(learningConfig);
        
        return NextResponse.json({
          success: true,
          message: 'AISync self-learning session started successfully',
          sessionId,
          status: 'learning',
          config: config || 'default'
        });

      case 'get-stats':
        console.log('📊 Getting AISync learning statistics...');
        const stats = await AISyncSelfLearning.getLearningStats();
        
        return NextResponse.json({
          success: true,
          stats
        });

      case 'start-continuous':
        const intervalHours = config?.intervalHours || 24;
        console.log(`🔄 Starting AISync continuous learning (every ${intervalHours} hours)...`);
        
        // Start continuous learning in background
        AISyncSelfLearning.startContinuousLearning(intervalHours);
        
        return NextResponse.json({
          success: true,
          message: `AISync continuous learning started (every ${intervalHours} hours)`,
          interval: intervalHours
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: start-session, get-stats, or start-continuous' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ AISync Self-Learning API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'AISync self-learning failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET requests for stats
export async function GET() {
  try {
    console.log('📊 Getting AISync learning statistics via GET...');
    const stats = await AISyncSelfLearning.getLearningStats();
    
    return NextResponse.json({
      success: true,
      message: 'AISync learning statistics',
      stats
    });

  } catch (error) {
    console.error('❌ Error getting AISync stats:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get learning statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
