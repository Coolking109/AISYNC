#!/usr/bin/env node

// Simple AISync Learning Test - Just 3 questions to debug
// Run this to test if the basic learning works

const { exec } = require('child_process');

console.log('🧪 AISync Learning Test (3 questions only)');
console.log('==========================================');

async function testLearning() {
  try {
    console.log('🚀 Testing AISync learning with just 3 questions...');
    
    // Make API call to trigger learning
    const response = await fetch('http://localhost:3000/api/aisync-learning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start-session',
        config: {
          maxQuestions: 3, // Just 3 questions for testing
          timeout: 60000   // 1 minute timeout
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AISync test learning session started!');
      console.log(`📊 Session ID: ${result.sessionId}`);
      console.log('🎯 Testing with 3 questions only...');
      
      // Monitor progress for 2 minutes
      let attempts = 0;
      const maxAttempts = 24; // 2 minutes (5 second intervals)
      
      const checkProgress = setInterval(async () => {
        attempts++;
        try {
          const statsResponse = await fetch('http://localhost:3000/api/aisync-learning');
          const statsResult = await statsResponse.json();
          
          if (statsResult.success && statsResult.stats.recentSessions.length > 0) {
            const lastSession = statsResult.stats.recentSessions[0];
            console.log(`📊 Progress: Session ${lastSession.status}, Questions: ${lastSession.questionsAsked || 0}, Patterns: ${lastSession.patternsLearned || 0}`);
            
            if (lastSession.status === 'completed' || lastSession.status === 'error') {
              clearInterval(checkProgress);
              console.log('🎉 Test session completed!');
              console.log(`   Final status: ${lastSession.status}`);
              console.log(`   Questions asked: ${lastSession.questionsAsked}`);
              console.log(`   Patterns learned: ${lastSession.patternsLearned}`);
              
              if (lastSession.status === 'error') {
                console.log(`   Error: ${lastSession.errorMessage || 'Unknown error'}`);
              }
            }
          }
        } catch (error) {
          console.log(`📊 Monitoring attempt ${attempts}: ${error.message}`);
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkProgress);
          console.log('⏰ Monitoring timeout - check server logs for details');
        }
      }, 5000); // Check every 5 seconds
      
    } else {
      console.error('❌ Failed to start test session:', result.message);
    }

  } catch (error) {
    console.error('❌ Error testing AISync learning:', error.message);
    console.log('\n💡 Make sure your development server is running:');
    console.log('   npm run dev');
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/aisync-learning');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('⚠️  Development server not detected at http://localhost:3000');
    console.log('🚀 Please start your server first:');
    console.log('   cd perplexity-chatbot');
    console.log('   npm run dev');
    console.log('\nThen run this test again.');
    return;
  }

  await testLearning();
}

// Add fetch if not available (for older Node.js versions)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(console.error);
