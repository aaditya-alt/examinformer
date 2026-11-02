function cleanWatermark(text) {
  if (!text || typeof text !== 'string') return text || '';
  let s = text;

  // 1. Remove Page markers and header artifacts
  s = s.replace(/\[PAGE_\d+_(?:LEFT|RIGHT)\]/gi, '');
  s = s.replace(/MOCKMATRIX\s*(?:PRACTICE\s*TO\s*PERFECTION)?/gi, '');
  s = s.replace(/PRACTICE\s*TO\s*PERFECTION/gi, '');

  // 2. Remove footer promotional links: YouTube, Telegram, Download App, Visit Website
  s = s.replace(/\b(?:YouTube\s+Telegram|\d+\s+Download\s+App\s+Visit\s+Website|Download\s+App\s+Visit\s+Website|Download\s+App|Visit\s+Website)\s*\d*/gi, '');
  s = s.replace(/YouTube\s+Telegram\s*\d*/gi, '');

  // 3. Remove disclaimer strings: "bsite, and every link redirects to that same website..."
  s = s.replace(/b?\s*site,\s*and\s*every\s*link\s*redirects[\s\S]*?mock\s*test\./gi, '');
  s = s.replace(/If\s+you\s+are\s+reading\s+this[\s\S]*?mock\s*test\./gi, '');
  s = s.replace(/ampered\s*with\s*—\s*those\s*links[\s\S]*?mock\s*test\./gi, '');

  // 4. Remove Table of contents / Jump To leaks
  s = s.replace(/(?:#\s*)?(?:CHAPTER|SUBJECT\s*\/\s*TOPIC)?\s*QS\s*ATTEMPT\s*DIRECT\s*JUMP[\s\S]*?(?=\n\n|\Z)/gi, '');
  s = s.replace(/\d+\s*Click\s+to\s+Attempt\s+Jump\s+To/gi, '');
  s = s.replace(/Click\s+to\s+Attempt\s+Jump\s+To/gi, '');
  s = s.replace(/Click\s+to\s+Attempt/gi, '');
  s = s.replace(/Jump\s+To/gi, '');
  s = s.replace(/PA\s*R\s*T\s*\d+/gi, '');
  s = s.replace(/Attempt\s+Part\s*\d+\s+Mock/gi, '');

  // 5. Remove chapter banner leaks like "CODING (90 Qs)", "ERIES (34 Qs)", "7\nCODING", etc.
  s = s.replace(/\b(?:REASONING|GENERAL\s+AWARENESS|MATHEMATICS|ENGLISH\s+LANGUAGE)\b/gi, '');
  s = s.replace(/\d+\s*\n\s*[A-Z\s&]+\s*\(\d+\s*Qs\)/gi, '');
  s = s.replace(/[A-Z\s&]+\s*\(\d+\s*Qs\)/gi, '');

  // 6. Remove Answer Key grid leaks if attached to option or question
  s = s.replace(/ANSWER\s+KEY[\s\S]*?(?=(?:\d+\s*\([a-d]\)|\Z))/gi, '');
  s = s.replace(/(?:\d+\s*\([a-d]\)\s*){4,}/gi, '');

  // 7. Strip leading "Q.1", "Q.2 " from question text
  s = s.replace(/^Q\.\d+\s*/gi, '');

  // Clean trailing / extra newlines & spaces
  s = s.replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

const samples = [
  "(2,4)(5,4)(3,6)(4,2)(1,4)(6,2)\nYouTube Telegram 35\n\n[PAGE_36_RIGHT]\nREASONING\nb site, and every link redirects to that same website. If you are\nampered with — those links will not give you any mock test.\n7\nCODING (90 Qs)",
  "Q.2 In the following question, a matrix is given. A\nrelationship exists among the elements in each\nrow/column. Study the pattern and choose the alternative\nYouTube Telegram 16\n\nREASONING\nb site, and every link redirects to that same website. If you are\nampered with — those links will not give you any mock test.\n3\nMBER (24 Qs)\nthat will replace the \"?\".\n3 6 2\n4 20 5\n6 18 ?"
];

samples.forEach((sample, i) => {
  console.log(`\n=== SAMPLE ${i + 1} ===`);
  console.log('CLEANED:\n' + cleanWatermark(sample));
});
