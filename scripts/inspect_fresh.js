const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
console.log('Total scripts in fresh_solution.html:', scripts.length);

for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (s.includes('answersData')) {
    console.log(`Script ${i} has answersData, length: ${s.length}`);
    const prefix = '<script>self.__next_f.push([1,"';
    const start = s.indexOf(prefix);
    const end = s.lastIndexOf('"])</script>');
    if (start !== -1 && end !== -1) {
      const rawInner = s.substring(start + prefix.length, end);
      const unescaped = JSON.parse('"' + rawInner + '"');
      const idx35 = unescaped.indexOf('"$35"');
      console.log('In answersData script, index of "$35":', idx35);
      if (idx35 !== -1) {
        console.log('Context around "$35":\n', unescaped.substring(idx35 - 150, idx35 + 200));
      }
    }
  }
}

// Check other scripts for 35: or "$35"
for (let i = 0; i < scripts.length; i++) {
  const s = scripts[i];
  if (s.includes('self.__next_f.push') && (s.includes('35:') || s.includes('35,') || s.includes('"35":'))) {
    console.log(`Script ${i} mentions 35, length: ${s.length}`);
    const start = s.indexOf('<script>self.__next_f.push([1,"');
    const end = s.lastIndexOf('"])</script>');
    if (start !== -1 && end !== -1) {
      const unescaped = JSON.parse('"' + s.substring(start + 30, end) + '"');
      const idx = unescaped.indexOf('35:');
      if (idx !== -1) {
        console.log('Snippet of 35::\n', unescaped.substring(idx, idx + 250));
      }
    }
  }
}
