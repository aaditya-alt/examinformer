async function testEndpoints() {
  const bases = [
    'https://api.repeatermock.com',
    'https://repeatermock.com'
  ];

  for (const base of bases) {
    console.log('\nTesting Base:', base);
    
    // 1. /api/v1/tests
    try {
      const r = await fetch(`${base}/api/v1/tests`);
      console.log(`${base}/api/v1/tests -> status:`, r.status);
      const text = await r.text();
      console.log('  sample:', text.slice(0, 300));
    } catch (e) {
      console.log(`${base}/api/v1/tests failed:`, e.message);
    }

    // 2. /api/v1/tests?slug=ssc-cgl
    try {
      const r = await fetch(`${base}/api/v1/tests?slug=ssc-cgl`);
      console.log(`${base}/api/v1/tests?slug=ssc-cgl -> status:`, r.status);
      const text = await r.text();
      console.log('  sample:', text.slice(0, 300));
    } catch (e) {
      console.log(`${base}/api/v1/tests?slug=ssc-cgl failed:`, e.message);
    }
  }
}

testEndpoints().catch(console.error);
