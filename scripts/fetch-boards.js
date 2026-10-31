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

async function fetchBoards() {
  const b = await get('https://mockmatrixhub.in/data/exams/boards.json');
  console.log('Boards status:', b.status);
  console.log('Boards data:', b.data.slice(0, 1500));

  const c = await get('https://mockmatrixhub.in/data/exam-categories.json');
  console.log('Categories status:', c.status);
  console.log('Categories data:', c.data.slice(0, 1500));
}

fetchBoards().catch(console.error);
