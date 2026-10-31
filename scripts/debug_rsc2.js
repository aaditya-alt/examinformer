const fs = require('fs');
const html = fs.readFileSync('./scripts/solution.html', 'utf8');
const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];

console.log('Total scripts found:', scripts.length);
scripts.forEach((s, idx) => {
  if (s.includes('answersData')) {
    console.log(`Script ${idx} has answersData, length: ${s.length}`);
  }
});
