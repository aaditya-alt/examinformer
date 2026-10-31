async function inspectRf() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0gvl6qgmxmb4k.js');
  const code = await res.text();
  const idx = code.indexOf('function rf(');
  if (idx !== -1) {
    console.log(code.slice(idx, idx + 600));
  } else {
    const idx2 = code.indexOf('let rf=');
    if (idx2 !== -1) {
      console.log(code.slice(idx2, idx2 + 600));
    } else {
      const idx3 = code.indexOf('rf=');
      console.log(code.slice(idx3, idx3 + 600));
    }
  }
}

inspectRf().catch(console.error);
