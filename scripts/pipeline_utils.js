const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gstoqyvnwpvhciidmigt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA';
const supabase = createClient(supabaseUrl, supabaseKey);

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rarr;/g, '→')
    .replace(/&larr;/g, '←')
    .replace(/&times;/g, '×')
    .replace(/&plusmn;/g, '±')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/&radic;/g, '√');
}

function cleanHtmlToKaTeX(html) {
  if (!html) return '';
  let text = decodeHtmlEntities(html);
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  text = text.replace(/<span[^>]*>/gi, '');
  text = text.replace(/<\/span>/gi, '');
  text = text.replace(/<strong>/gi, '**');
  text = text.replace(/<\/strong>/gi, '**');
  text = text.replace(/<b>/gi, '**');
  text = text.replace(/<\/b>/gi, '**');
  text = text.replace(/<em>/gi, '*');
  text = text.replace(/<\/em>/gi, '*');
  text = text.replace(/<i>/gi, '*');
  text = text.replace(/<\/i>/gi, '*');
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (m) => m.replace(/<[^>]+>/g, ' '));
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  return text;
}

function extractTestAndAnswersFromHtml(html) {
  const regex = /<script>self\.__next_f\.push\(\[(\d+),"(.*?)"\]\)<\/script>/g;
  let match;
  const rawPushes = [];

  while ((match = regex.exec(html)) !== null) {
    try {
      const unescaped = JSON.parse(`"${match[2]}"`);
      rawPushes.push(unescaped);
    } catch (e) {}
  }

  const fullStream = rawPushes.join('');
  const streamMap = new Map();

  // Find all `<id>:T<len>,` chunks in the unified flight stream
  const headerRegex = /(?:^|\n)([0-9a-fA-F]+):T[0-9a-fA-F]+,/g;
  const matches = [];
  let m;
  while ((m = headerRegex.exec(fullStream)) !== null) {
    matches.push({
      id: m[1].toLowerCase(),
      headerStart: m.index,
      contentStart: m.index + m[0].length
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].headerStart : fullStream.length;
    let content = fullStream.slice(curr.contentStart, nextStart);
    if (content.endsWith('\n')) content = content.slice(0, -1);
    streamMap.set(curr.id, content);
  }

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
    if (val.startsWith('$')) {
      const refId = val.substring(1).toLowerCase();
      if (streamMap.has(refId)) {
        return streamMap.get(refId);
      }
    }
    return val;
  }

  return { testData, answersData, resolveValue, streamMap };
}

async function fetchTestRaw(seriesSlug, testId) {
  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://repeatermock.com',
    'Referer': `https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/attempt`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };

  const startRes = await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ seriesSlug, reattempt: false })
  });

  const cookie = startRes.headers.get('set-cookie')?.split(';')[0] || '';

  await fetch(`https://api.repeatermock.com/api/v1/attempts/${testId}/submit`, {
    method: 'POST',
    headers: { ...headers, Cookie: cookie },
    body: JSON.stringify({ task: 'submit', responses: {}, currentQuestion: 0 })
  });

  const solRes = await fetch(`https://repeatermock.com/tb/test-series/${seriesSlug}/test/${testId}/solution`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Cookie: cookie
    }
  });

  return solRes.text();
}

// Format human friendly shift titles e.g. "SSC CGL 2025 Tier-1 — 12 Sep 2025 (Shift 1)"
function formatDisplayTitle(rawTitle, examType) {
  // e.g. "SSC CGL 2025 (Held On: 12 Sept, 2025 Shift 1)"
  const shiftMatch = rawTitle.match(/(\d+\s+[A-Za-z]+,?\s+\d{4})\s+(Shift\s+\d+)/i) ||
                     rawTitle.match(/Held On:\s*([^\)]+)/i);
  if (shiftMatch) {
    let dateAndShift = shiftMatch[0].replace('Held On:', '').trim();
    return `${examType} — ${dateAndShift}`;
  }
  return `${examType} — ${rawTitle}`;
}

module.exports = {
  supabase,
  decodeHtmlEntities,
  cleanHtmlToKaTeX,
  extractTestAndAnswersFromHtml,
  fetchTestRaw,
  formatDisplayTitle
};
