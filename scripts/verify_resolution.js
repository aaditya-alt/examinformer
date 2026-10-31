const fs = require('fs');
const html = fs.readFileSync('./scripts/fresh_solution.html', 'utf8');

function extractTestAndAnswers(html) {
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  const rawPushes = [];

  while ((match = regex.exec(html)) !== null) {
    try {
      const unescaped = JSON.parse(`"${match[2]}"`);
      rawPushes.push(unescaped);
    } catch (e) {}
  }

  const streamMap = new Map();
  let currentId = null;

  for (let i = 0; i < rawPushes.length; i++) {
    const p = rawPushes[i];
    const m = p.match(/^([0-9a-fA-F]+):([A-Z])([0-9a-fA-F]*),(.*)/s);
    if (m) {
      const id = m[1].toLowerCase();
      const content = m[4];
      streamMap.set(id, content);
      currentId = id;
    } else if (currentId && streamMap.has(currentId)) {
      streamMap.set(currentId, streamMap.get(currentId) + p);
    }
  }

  // Find answersData and testData
  let answersData = null;
  let testData = null;

  for (const p of rawPushes) {
    if (p.includes('"answersData"') && p.includes('"testData"')) {
      const tdStart = p.indexOf('"testData":') + 11;
      const adStart = p.indexOf('"answersData":') + 14;
      const rdStart = p.indexOf(',"responsesData":');
      answersData = JSON.parse(p.slice(adStart, rdStart));
      testData = JSON.parse(p.slice(tdStart, p.indexOf(',"answersData":')));
      break;
    }
  }

  function resolveValue(val) {
    if (!val || typeof val !== 'string') return val;
    if (val.startsWith('$') && streamMap.has(val.substring(1).toLowerCase())) {
      return streamMap.get(val.substring(1).toLowerCase());
    }
    return val;
  }

  return { testData, answersData, resolveValue, streamMap };
}

const { testData, answersData, resolveValue, streamMap } = extractTestAndAnswers(html);
console.log('Total questions in testData:', testData.sections.reduce((acc, s) => acc + s.questions.length, 0));
let dollarCount = 0;
let resolvedCount = 0;

for (const qId in answersData) {
  const ans = answersData[qId];
  let enVal = ans?.sol?.en?.value;
  if (enVal && enVal.startsWith('$')) {
    dollarCount++;
    const resolved = resolveValue(enVal);
    if (resolved && !resolved.startsWith('$')) {
      resolvedCount++;
    }
  }
}

console.log(`Dollar refs found: ${dollarCount}, Successfully resolved: ${resolvedCount}`);
