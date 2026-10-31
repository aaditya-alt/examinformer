async function testSubmit() {
  const testId = '6a0f3ef125f9d428c136a83a';
  const url = `https://api.repeatermock.com/api/v1/attempts/${testId}/submit`;
  const payload = {
    task: "submit",
    responses: {},
    currentQuestion: 0
  };

  console.log('Posting to:', url);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://repeatermock.com',
      'Referer': `https://repeatermock.com/tb/test-series/ssc-cgl/test/${testId}/attempt`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const json = await res.json().catch(async () => await res.text());
  console.log('Response:', json);
}

testSubmit().catch(console.error);
