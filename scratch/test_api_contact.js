async function run() {
  console.log('Sending post request to http://localhost:5000/api/posts/contact...');
  try {
    const response = await fetch('http://localhost:5000/api/posts/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test user',
        email: 'test@example.com',
        subject: 'API test',
        message: 'This is a test message from test_api_contact.js script.'
      })
    });
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Data:', data);
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
}

run();
