async function testFullAttemptFlow() {
  const testId = '6a0f3ef125f9d428c136a83a';
  const seriesSlug = 'ssc-cgl';

  let cookies = '';

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://repeatermock.com',
    'Referer': `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/attempt`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  // Step 1: Start Attempt
  console.log('1. Starting attempt...');
  const startUrl = `https://api.repeatermock.com/api/v1/attempts/${testId}/start`;
  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { ...headers },
    body: JSON.stringify({ seriesSlug, reattempt: false })
  });

  console.log('Start Status:', startRes.status);
  const setCookie = startRes.headers.get('set-cookie');
  if (setCookie) {
    cookies = setCookie.split(';')[0];
    console.log('Got cookie:', cookies);
  }
  const startJson = await startRes.json();
  console.log('Start result:', startJson);

  // Step 2: Submit Attempt
  console.log('\n2. Submitting attempt...');
  const submitUrl = `https://api.repeatermock.com/api/v1/attempts/${testId}/submit`;
  const submitRes = await fetch(submitUrl, {
    method: 'POST',
    headers: { ...headers, 'Cookie': cookies },
    body: JSON.stringify({ task: 'submit', responses: {}, currentQuestion: 0 })
  });

  console.log('Submit Status:', submitRes.status);
  const submitJson = await submitRes.json();
  console.log('Submit result:', submitJson);

  // Step 3: Now fetch solution page or answers API
  console.log('\n3. Fetching solution page...');
  const solUrl = `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/solution`;
  const solRes = await fetch(solUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Cookie': cookies
    }
  });
  console.log('Solution Page Status:', solRes.status);
  const solHtml = await solRes.text();
  console.log('Solution HTML length:', solHtml.length);
  require('fs').writeFileSync('scripts/solution_authed.html', solHtml);
  console.log('Saved solution_authed.html');
}

testFullAttemptFlow().catch(console.error);
