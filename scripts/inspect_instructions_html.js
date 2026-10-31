const fs = require('fs');

async function inspectInstructionsHtml() {
  const html = fs.readFileSync('scripts/instructions.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  for (const s of scripts) {
    if (s.includes('testId') || s.includes('instructions') || s.includes('Start')) {
      console.log('Script length:', s.length);
      // look for url
      const urls = [...s.matchAll(/\/tb\/test-series\/[^\s"',\\]+/g)].map(m => m[0]);
      if (urls.length > 0) {
        console.log('URLs:', [...new Set(urls)]);
      }
      // search for test or attempt route
      const testRoutes = [...s.matchAll(/\/test\/[^\s"',\\]+/g)].map(m => m[0]);
      if (testRoutes.length > 0) {
        console.log('Test routes:', [...new Set(testRoutes)]);
      }
    }
  }
}

inspectInstructionsHtml().catch(console.error);
