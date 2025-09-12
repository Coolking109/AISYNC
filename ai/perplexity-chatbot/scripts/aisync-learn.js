#!/usr/bin/env node

// AISync Self-Learning Trigger Script
// Run this script to make AISync learn from ChatGPT

const { exec } = require('child_process');
const path = require('path');

console.log('🧠 AISync Self-Learning Trigger');
console.log('================================');

async function triggerLearning() {
  try {
    console.log('🚀 Starting AISync self-learning session...');
    
    // Make API call to trigger learning
    const response = await fetch('http://localhost:3000/api/aisync-learning', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'start-session'
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ AISync learning session started successfully!');
      console.log(`📊 Session ID: ${result.sessionId}`);
      console.log('🎯 AISync is now learning from ChatGPT...');
      
      // Show progress
      setTimeout(async () => {
        try {
          const statsResponse = await fetch('http://localhost:3000/api/aisync-learning');
          const statsResult = await statsResponse.json();
          
          if (statsResult.success) {
            console.log('\n📈 Learning Progress:');
            console.log(`   🧠 Total Patterns Learned: ${statsResult.stats.totalPatternsLearned}`);
            console.log(`   📚 Recent Sessions: ${statsResult.stats.recentSessions.length}`);
            
            if (statsResult.stats.topTopics.length > 0) {
              console.log('   🎯 Top Learning Topics:');
              statsResult.stats.topTopics.slice(0, 5).forEach((topic, index) => {
                console.log(`      ${index + 1}. ${topic._id}: ${topic.count} patterns`);
              });
            }
          }
        } catch (error) {
          console.log('📊 (Unable to fetch current stats)');
        }
      }, 5000);
      
    } else {
      console.error('❌ Failed to start learning session:', result.message);
    }

  } catch (error) {
    console.error('❌ Error triggering AISync learning:', error.message);
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
    console.log('\nThen run this script again.');
    return;
  }

  await triggerLearning();
}

// Add fetch if not available (for older Node.js versions)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(console.error);
