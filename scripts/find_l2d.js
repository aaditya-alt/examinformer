const fs = require('fs');

async function findL2d() {
  const html = fs.readFileSync('scripts/attempt.html', 'utf8');
  // Search for "2d:" or "[2d," or similar
  const matches = [...html.matchAll(/(\w+):I\[(\d+),\[([^\]]+)\],"default"\]/g)];
  for (const m of matches) {
    if (m[1] === '2d' || m[3].includes('attempt')) {
      console.log('Match:', m[0]);
    }
  }
}

findL2d().catch(console.error);
