async function testFetchQuestions() {
  const testId = '6a0f3ef125f9d428c136a83a';
  const endpoints = [
    `https://api.repeatermock.com/api/tests/${testId}`,
    `https://api.repeatermock.com/api/tests/${testId}/answers`,
    `https://api.repeatermock.com/api/v1/tests/${testId}`,
    `https://api.repeatermock.com/api/v1/test/${testId}`,
    `https://api.repeatermock.com/api/v1/attempts/${testId}/start`,
    `https://repeatermock.com/api/tests/${testId}`
  ];

  for (const ep of endpoints) {
    console.log('\nTrying:', ep);
    try {
      const res = await fetch(ep, {
        headers: {
          'Origin': 'https://repeatermock.com',
          'Referer': 'https://repeatermock.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      console.log('Status:', res.status, res.headers.get('content-type'));
      const text = await res.text();
      console.log('Snippet:', text.slice(0, 300));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

testFetchQuestions().catch(console.error);
