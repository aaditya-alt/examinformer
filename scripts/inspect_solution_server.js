const fs = require('fs');

async function inspectSolutionServer() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0ykj_90akhor_.js');
  const code = await res.text();
  console.log('0ykj_90akhor_.js length:', code.length);
  console.log(code.slice(0, 1500));
}

inspectSolutionServer().catch(console.error);
