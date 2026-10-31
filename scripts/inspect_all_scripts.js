const fs = require('fs');

async function inspectAllScripts() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];

  scripts.forEach((s, idx) => {
    if (s.length > 10000) {
      console.log(`Large script #${idx} length:`, s.length);
      // check if it has JSON or object
      console.log('  sample:', s.slice(0, 300));
    }
  });
}

inspectAllScripts().catch(console.error);
