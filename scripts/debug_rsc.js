const fs = require('fs');
const html = fs.readFileSync('./scripts/solution.html', 'utf8');
const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];

for (let i = 0; i < scripts.length; i++) {
  if (scripts[i].includes('self.__next_f.push')) {
    if (scripts[i].includes('answersData')) {
      const prefix = '<script>self.__next_f.push([1,"';
      const start = scripts[i].indexOf(prefix);
      const end = scripts[i].lastIndexOf('"])</script>');
      const unescaped = JSON.parse('"' + scripts[i].substring(start + prefix.length, end) + '"');
      const idx = unescaped.indexOf('"$35"');
      console.log('Script index:', i);
      console.log('Index of "$35":', idx);
      if (idx !== -1) {
        console.log('Snippet around "$35":', unescaped.substring(idx - 150, idx + 150));
      }
    }
  }
}
