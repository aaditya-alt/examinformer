async function findAnswersData() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/00fdonmznjf37.js');
  const code = await res.text();
  const idx = code.indexOf('answersData');
  console.log('Snippet around answersData:');
  console.log(code.slice(Math.max(0, idx - 400), idx + 800));
}

findAnswersData().catch(console.error);
