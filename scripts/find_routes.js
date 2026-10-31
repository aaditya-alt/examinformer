async function findAllRoutes() {
  const res = await fetch('https://repeatermock.com/_next/static/chunks/0zwt.o_4iix~3.js');
  const code = await res.text();
  const routes = [...code.matchAll(/(\/(?:api|auth|tb|tests|attempts)[^\s"'`,);]+)/g)].map(m => m[1]);
  console.log('Routes in chunk:');
  routes.forEach(r => console.log(' ', r));
}
findAllRoutes().catch(console.error);
