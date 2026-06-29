const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sendEmail = require('../backend/utils/sendEmail');

async function run() {
  console.log('Testing sendEmail with Resend configuration...');
  
  // Set temporary dummy RESEND_API_KEY to trigger the Resend code block in sendEmail.js
  process.env.RESEND_API_KEY = 're_123456789';
  console.log('Dummy RESEND_API_KEY set:', process.env.RESEND_API_KEY);

  try {
    // This will try to fetch resend.com but fail with authorization error since the key is dummy.
    // This is perfect because it confirms the Resend HTTP API path is executed!
    await sendEmail({
      email: 'test@example.com',
      subject: 'Resend API Test',
      text: 'Testing Resend path',
      html: '<p>Testing Resend path</p>'
    });
  } catch (error) {
    console.log('Caught expected Resend error:', error.message);
  }
}

run();
