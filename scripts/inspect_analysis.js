const fs = require('fs');

async function inspectAnalysis() {
  const html = fs.readFileSync('scripts/analysis.html', 'utf8');
  console.log('Analysis HTML length:', html.length);

  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  console.log('Scripts in analysis:', scripts.length);

  scripts.forEach((s, i) => {
    if (s.includes('solutions') || s.includes('questions') || s.includes('answers') || s.includes('score') || s.includes('testId')) {
      console.log(`Script ${i} length: ${s.length}`);
      console.log('  snippet:', s.slice(0, 300));
    }
  });
}

inspectAnalysis().catch(console.error);
