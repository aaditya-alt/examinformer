const fs = require('fs');

async function checkParser() {
  const html = fs.readFileSync('scripts/solution_authed.html', 'utf8');
  const scripts = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
  
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i];
    if (s.includes('answersData')) {
      console.log(`Script #${i} has answersData, length: ${s.length}`);
      // Find start of testData and answersData
      const idxTD = s.indexOf('\\"testData\\":');
      const idxTD2 = s.indexOf('"testData":');
      console.log('TD escaped:', idxTD, 'un-escaped:', idxTD2);

      const prefix = '<script>self.__next_f.push([1,"';
      const start = s.indexOf(prefix);
      const end = s.lastIndexOf('"])</script>');
      if (start !== -1 && end !== -1) {
        const content = s.substring(start + prefix.length, end);
        const unescaped = JSON.parse(`"${content}"`);
        console.log('Successfully unescaped, length:', unescaped.length);

        const tdStart = unescaped.indexOf('"testData":') + 11;
        const adStart = unescaped.indexOf('"answersData":') + 14;
        const rdStart = unescaped.indexOf(',"responsesData":');

        const adStr = unescaped.slice(adStart, rdStart);
        const answersData = JSON.parse(adStr);

        const tdStr = unescaped.slice(tdStart, unescaped.indexOf(',"answersData":'));
        const testData = JSON.parse(tdStr);

        console.log('Test Title:', testData.title);
        console.log('Sections:', testData.sections.length);
        console.log('Answers keys count:', Object.keys(answersData).length);
      }
    }
  }
}

checkParser().catch(console.error);
