async function searchAnswersDataUsage() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/00fdonmznjf37.js');
  const code = await res.text();
  const matches = [...code.matchAll(/answersData[:=]([^,\)\;\}]+)/g)];
  console.log('Matches:', matches.map(m => m[0]));

  // Find all occurrences of answersData
  let pos = 0;
  while ((pos = code.indexOf('answersData', pos)) !== -1) {
    console.log('\n--- occurrence at', pos);
    console.log(code.slice(Math.max(0, pos - 200), pos + 400));
    pos += 'answersData'.length;
  }
}

searchAnswersDataUsage().catch(console.error);
