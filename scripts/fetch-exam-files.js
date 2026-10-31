const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function fetchExamFiles() {
  const urls = [
    'https://mockmatrixhub.in/data/exams/ssc.json',
    'https://mockmatrixhub.in/data/exams/railway.json',
    'https://data.mockmatrixhub.in/data/cgl-data.json',
    'https://data.mockmatrixhub.in/data/ntpc-data.json',
    'https://data.mockmatrixhub.in/data/chsl-data.json',
    'https://data.mockmatrixhub.in/data/mts-data.json',
    'https://data.mockmatrixhub.in/data/cpo-data.json'
  ];

  for (const u of urls) {
    const res = await get(u);
    console.log(`\nURL: ${u} | Status: ${res.status} | Length: ${res.data.length}`);
    if (res.status === 200) {
      console.log('Sample content:', res.data.slice(0, 500));
    }
  }
}

fetchExamFiles().catch(console.error);
