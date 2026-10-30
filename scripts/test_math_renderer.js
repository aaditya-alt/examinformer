const text = `### Step-by-Step Mathematical Derivation:

**Target:** Find \\( \\mathbf{2: 2.5: 8} \\)

- **Given Expression:** If 50% of A = 0.4 of B
#### Detailed Working:
1. **Identify the Core Formula:** Standard rule.

> **💡 Exam Informer Speed Trick:** Eliminate options quickly!`;

function formatClean(content) {
  let res = content;
  // Replace headings (most specific first)
  res = res.replace(/^####\s*(.*)$/gm, '<div class="font-bold text-xs uppercase tracking-wider text-sky-700 dark:text-sky-400 mt-2 mb-1">$1</div>');
  res = res.replace(/^###\s*(.*)$/gm, '<div class="font-extrabold text-sm text-slate-900 dark:text-white mt-2 mb-1">$1</div>');
  res = res.replace(/^##\s*(.*)$/gm, '<div class="font-black text-base text-slate-900 dark:text-white mt-3 mb-1">$1</div>');
  // Replace blockquotes
  res = res.replace(/^>\s*(.*)$/gm, '<div class="my-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-400 text-xs text-amber-900 dark:text-amber-200 rounded-r">$1</div>');
  // Replace bold
  res = res.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
  // Replace italic
  res = res.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  // Replace list items
  res = res.replace(/^[-*]\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-1"><span class="text-sky-500 font-bold">•</span><span>$1</span></div>');
  // Replace numbered items
  res = res.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex items-start gap-1.5 my-1"><span class="font-bold text-slate-500">$1.</span><span>$2</span></div>');
  // Clean any remaining orphan # or *
  res = res.replace(/[#*]/g, '');
  return res;
}

console.log(formatClean(text));
