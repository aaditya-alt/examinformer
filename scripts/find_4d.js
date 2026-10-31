const { fetchTestRaw } = require('./pipeline_utils');

async function run() {
  const html = await fetchTestRaw('ssc-cgl', '6a0f3ef35a73de9e21cdf098');
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  let pushes = [];
  while ((match = regex.exec(html)) !== null) {
    try {
      pushes.push(JSON.parse(`"${match[2]}"`));
    } catch (e) {}
  }

  // Look for any mention of 4d
  for (let i = 0; i < pushes.length; i++) {
    const p = pushes[i];
    if (p.includes('4d:') || p.includes('4D:') || p.includes('\n4d:') || p.includes('\n4D:')) {
      console.log(`Push ${i} has 4d:`, p.substring(0, 150));
    }
  }

  // Let's see what questions have $4d in answersData
  let answersData = null;
  for (const p of pushes) {
    if (p.includes('"answersData"') && p.includes('"testData"')) {
      const adStart = p.indexOf('"answersData":') + 14;
      const rdStart = p.indexOf(',"responsesData":');
      answersData = JSON.parse(p.slice(adStart, rdStart));
      break;
    }
  }

  if (answersData) {
    for (const qId in answersData) {
      const sol = answersData[qId]?.sol?.en?.value;
      if (sol === '$4d') {
        console.log('Question with $4d:', qId, answersData[qId]?.sol);
      }
    }
  }
}

run().catch(console.error);
