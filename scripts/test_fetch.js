const fs = require('fs');

async function testFetch() {
  const seriesSlug = 'ssc-cgl';
  const testId = '6a0f3ef125f9d428c136a83a';
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://repeatermock.com',
    'Referer': `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/attempt`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  const startRes = await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ seriesSlug, reattempt: false })
  });
  const cookie = startRes.headers.get('set-cookie')?.split(';')[0] || '';

  await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/submit`, {
    method: 'POST',
    headers: { ...headers, Cookie: cookie },
    body: JSON.stringify({ task: 'submit', responses: {}, currentQuestion: 0 })
  });

  const solRes = await fetch(`https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/solution`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Cookie: cookie
    }
  });

  const html = await solRes.text();
  fs.writeFileSync('./scripts/fresh_solution.html', html);
  console.log('Saved fresh_solution.html, length:', html.length);
}

testFetch().catch(console.error);
