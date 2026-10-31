async function inspectSubmitPayload() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0gvl6qgmxmb4k.js');
  const code = await res.text();
  const idx = code.indexOf('/attempts/${A}/submit');
  console.log('Snippet around submit:');
  console.log(code.slice(Math.max(0, idx - 400), idx + 600));
}

inspectSubmitPayload().catch(console.error);
