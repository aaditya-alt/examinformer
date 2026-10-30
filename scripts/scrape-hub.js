const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

const files = [
  'quizzes/others/data/ntpc-g-25-math-top-100-1.json',
  'quizzes/ssc/cgl/full-mock/data/cgl-25-12-sep-s3-full.json',
  'quizzes/ssc/cgl/full-mock/data/cgl_25_18_sept_s3.json',
  'quizzes/ssc/cgl/full-mock/data/ssc_cgl_17sep_s2_full.json',
  'quizzes/ssc/cgl/full-mock/data/testnew.json',
  'quizzes/ssc/cgl/subject/data/GKTest.json',
  'quizzes/ssc/cgl/subject/data/NTPC-100.json',
  'quizzes/ssc/cgl/subject/data/cgl-25-eng-sentence-improve.json',
  'quizzes/ssc/cgl/subject/data/cgl-25-eng-spot-error-pyq.json',
  'quizzes/ssc/cgl/subject/data/nwtest.json',
  'quizzes/ssc/chsl/subject/data/cgl_new_new.json',
  'quizzes/ssc/cpo/full-mock/data/ssc_cgl_17sep_full.json',
  'quizzes/ssc/cpo/sectional/data/newtest1.json'
];

async function run() {
  for (const f of files) {
    const raw = await get(`https://raw.githubusercontent.com/mockmatrixhub/mockmatrixhub.github.io/main/${f}`);
    if (raw) {
      let qCount = 0;
      if (raw.sections) {
        Object.values(raw.sections).forEach(arr => qCount += (arr ? arr.length : 0));
      } else if (raw.questions) {
        qCount = raw.questions.length;
      }
      console.log(f, 'Title:', raw.meta ? raw.meta.title : raw.title, 'Total Qs:', qCount);
    } else {
      console.log('Failed to parse:', f);
    }
  }
}
run();
