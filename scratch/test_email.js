const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sendEmail = require('../backend/utils/sendEmail');

async function run() {
  console.log('Starting email test...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
  
  try {
    const res = await sendEmail({
      email: 'mkmkbhojawas@gmail.com',
      subject: 'Test Email from CampusFind Scratch Script',
      text: 'This is a test message to verify the nodemailer configuration.',
      html: '<h1>CampusFind Test</h1><p>This is a test message to verify nodemailer.</p>'
    });
    console.log('Result from sendEmail:', res);
  } catch (error) {
    console.error('Error during sendEmail execution:', error);
  }
}

run();
