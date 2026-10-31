async function extractTestsCall() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const idx = code.indexOf('/tests${');
  if (idx !== -1) {
    console.log(code.slice(Math.max(0, idx - 400), idx + 400));
  } else {
    console.log('Not found /tests${');
    const idx2 = code.indexOf('/tests');
    console.log(code.slice(Math.max(0, idx2 - 200), idx2 + 400));
  }
}
extractTestsCall().catch(console.error);
