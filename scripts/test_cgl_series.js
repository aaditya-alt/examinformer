async function fetchCglSeries() {
  const url = 'https://api.repeatermock.com/api/v1/test-series/ssc-cgl';
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'Origin': 'https://repeatermock.com',
      'Referer': 'https://repeatermock.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log('Status:', res.status);
  const json = await res.json();
  console.log('Keys:', Object.keys(json));
  if (json.data) {
    console.log('data keys:', Object.keys(json.data));
    console.log('name:', json.data.name);
    console.log('sections count:', json.data.sections?.length);
    console.log('sections:', json.data.sections?.map(s => ({ id: s.id, name: s.name, subsections: s.subsections?.map(sub => ({ id: sub.id, name: sub.name })) })));
  } else {
    console.log('Response:', JSON.stringify(json).slice(0, 500));
  }
}

fetchCglSeries().catch(console.error);
