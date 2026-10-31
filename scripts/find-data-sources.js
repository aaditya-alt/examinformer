const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function findDataSources() {
  const js1 = await get('https://mockmatrixhub.in/js/live-mock-engine.js');
  const js2 = await get('https://mockmatrixhub.in/js/exams-index-engine.js');
  const js3 = await get('https://mockmatrixhub.in/js/exam-boards.js');

  console.log('--- live-mock-engine JSON/data matches ---');
  const m1 = [...js1.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
  console.log('Live mock JSONs:', [...new Set(m1)]);

  console.log('\n--- exams-index-engine JSON/data matches ---');
  const m2 = [...js2.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
  console.log('Exams index JSONs:', [...new Set(m2)]);

  console.log('\n--- exam-boards JSON/data matches ---');
  const m3 = [...js3.matchAll(/(https?:\/\/[^\s"'<>]+\.json|(?:\/|\.\/)[a-zA-Z0-9_\-\/]+\.json)/g)].map(m => m[1]);
  console.log('Exam boards JSONs:', [...new Set(m3)]);
}

findDataSources().catch(console.error);
