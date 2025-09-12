// Test script to verify question generation variety
async function testQuestionGeneration() {
  try {
    const response = await fetch('http://localhost:3000/api/aisync-learning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start-session',
        config: { maxQuestions: 5 } // Test with 5 questions only
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Test learning session started successfully!');
      console.log(`📋 Session ID: ${result.sessionId}`);
      console.log('🔍 Check the server logs to see if questions are varied');
    } else {
      console.error('❌ Test failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error testing questions:', error.message);
  }
}

console.log('🧪 Testing AISync Question Generation Variety');
console.log('===============================================');
testQuestionGeneration();
