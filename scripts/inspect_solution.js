const fs = require('fs');

async function main() {
  const html = fs.readFileSync('scripts/solution.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  console.log('Total scripts:', scripts.length);
  scripts.forEach((s, i) => {
    if (s.includes('testId') || s.includes('solution') || s.includes('answers') || s.includes('chunks')) {
      console.log(`Script ${i} len: ${s.length}`);
      console.log('  snippet:', s.slice(0, 300));
    }
  });
}

main().catch(console.error);
