import { NextRequest, NextResponse } from 'next/server';
import { LearningAI } from '@/lib/learning-ai';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { messageId, feedback, question } = await request.json();

    if (!messageId || !feedback || !['positive', 'negative', 'neutral'].includes(feedback)) {
      return NextResponse.json(
        { success: false, message: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Initialize Learning AI if not already done
    await LearningAI.initialize();

    // Process the feedback for Learning AI
    await LearningAI.processFeedback(question || '', feedback, messageId);

    // Get AI statistics for monitoring
    const stats = await LearningAI.getMetrics();

    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      aiStats: {
        totalPatterns: stats.totalPatterns,
        averageAccuracy: (stats.averageAccuracy * 100).toFixed(1) + '%',
        totalResponses: stats.totalResponses,
        learningScore: (stats.learningScore * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Feedback processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process feedback' },
      { status: 500 }
    );
  }
}
