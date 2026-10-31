const fs = require('fs');

async function inspectAttemptData() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  console.log('Total length:', html.length);

  // Search for questions in next_f scripts
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  console.log('Scripts count:', scripts.length);

  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    if (s.includes('questions') || s.includes('options') || s.includes('General Intelligence') || s.includes('Quantitative Aptitude')) {
      console.log(`Script ${i} length: ${s.length}`);
      // Find sample question
      const qIdx = s.indexOf('question');
      if (qIdx !== -1) {
        console.log('Snippet around question:');
        console.log(s.slice(Math.max(0, qIdx - 100), qIdx + 400));
        break;
      }
    }
  }
}

inspectAttemptData().catch(console.error);
