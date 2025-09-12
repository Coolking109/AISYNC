// Test script for delete account functionality
// Run this in the browser console or as a Node.js script

async function testDeleteAccount() {
  const userId = 'test-user-123';
  
  // Create a simple token for testing
  const tokenData = { userId: userId };
  const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
  
  console.log('🧪 Testing Delete Account API...');
  console.log('User ID:', userId);
  console.log('Token:', token);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/delete-account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    console.log('📡 Response Status:', response.status);
    console.log('📄 Response Data:', data);
    
    if (data.success) {
      console.log('✅ Account deletion successful!');
      
      // Check if user is actually removed
      const checkResponse = await fetch('http://localhost:3000/api/auth/get-preferences', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const checkData = await checkResponse.json();
      console.log('🔍 Verification check:', checkData);
      
      if (checkResponse.status === 404) {
        console.log('✅ User successfully removed from database');
      } else {
        console.log('❌ User still exists in database');
      }
      
    } else {
      console.log('❌ Account deletion failed:', data.message);
    }
    
  } catch (error) {
    console.error('🚨 Test error:', error);
  }
}

// Instructions for running the test:
console.log('🔧 To test delete account functionality:');
console.log('1. Make sure the dev server is running (npm run dev)');
console.log('2. Copy this entire script');
console.log('3. Open browser console and paste it');
console.log('4. Run: testDeleteAccount()');

// Auto-run if in Node.js environment
if (typeof window === 'undefined' && typeof fetch !== 'undefined') {
  testDeleteAccount();
}
