const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
let content = fs.readFileSync(adminPath, 'utf8');

// 1. Update handleConvertToMock body
const oldHandlerTarget = `    const targetCode = targetSeriesMap[shift.shiftKey] || (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');
    const targetTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';

    setConvertingShiftKey(shift.shiftKey);
    setConvertSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/push-to-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          targetExamCode: targetCode,
          targetCategory: targetTier,
          generateAISolutions: true
        })
      });`;

const newHandlerTarget = `    const targetCode = targetSeriesMap[shift.shiftKey] || (shift.examTitle?.toLowerCase().includes('graduate') ? 'rrb-ntpc-grad' : 'rrb-ntpc-ug');
    const targetTier = targetTierMap[shift.shiftKey] || 'pyq_tier1';
    const targetYear = targetYearMap[shift.shiftKey] || (shift.examDate ? (parseInt(shift.examDate.slice(0, 4), 10) || 2025) : 2025);
    const customTitle = customTitleMap[shift.shiftKey] || shift.examTitle;

    setConvertingShiftKey(shift.shiftKey);
    setConvertSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/push-to-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          targetExamCode: targetCode,
          targetCategory: targetTier,
          examYear: targetYear,
          customTitle,
          generateAISolutions: true
        })
      });`;

// Normalize line breaks for matching
content = content.replace(/\r\n/g, '\n');
const normalizedOldHandler = oldHandlerTarget.replace(/\r\n/g, '\n');
const normalizedNewHandler = newHandlerTarget.replace(/\r\n/g, '\n');

if (content.includes(normalizedOldHandler)) {
  content = content.replace(normalizedOldHandler, normalizedNewHandler);
  console.log('Successfully patched handleConvertToMock!');
} else {
  console.warn('Could not find oldHandlerTarget in admin page');
}

// 2. Add Year and Custom Title dropdown in JSX
const oldJsxTarget = `                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tier</label>
                          <select
                            value={currentTier}
                            onChange={(e) => setTargetTierMap({ ...targetTierMap, [shift.shiftKey]: e.target.value as any })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value="pyq_tier1">CBT-1 (Tier 1)</option>
                            <option value="pyq_tier2">CBT-2 (Tier 2)</option>
                          </select>
                        </div>`;

const newJsxTarget = `                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Exam Year</label>
                          <select
                            value={targetYearMap[shift.shiftKey] || 2025}
                            onChange={(e) => setTargetYearMap({ ...targetYearMap, [shift.shiftKey]: Number(e.target.value) })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value={2026}>2026</option>
                            <option value={2025}>2025</option>
                            <option value={2024}>2024</option>
                            <option value={2023}>2023</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Tier</label>
                          <select
                            value={currentTier}
                            onChange={(e) => setTargetTierMap({ ...targetTierMap, [shift.shiftKey]: e.target.value as any })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                          >
                            <option value="pyq_tier1">CBT-1 (Tier 1)</option>
                            <option value="pyq_tier2">CBT-2 (Tier 2)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase block">Custom Title (Optional)</label>
                          <input
                            type="text"
                            placeholder={shift.examTitle || 'Shift Title'}
                            value={customTitleMap[shift.shiftKey] || ''}
                            onChange={(e) => setCustomTitleMap({ ...customTitleMap, [shift.shiftKey]: e.target.value })}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold w-48"
                          />
                        </div>`;

const normalizedOldJsx = oldJsxTarget.replace(/\r\n/g, '\n');
const normalizedNewJsx = newJsxTarget.replace(/\r\n/g, '\n');

if (content.includes(normalizedOldJsx)) {
  content = content.replace(normalizedOldJsx, normalizedNewJsx);
  console.log('Successfully patched JSX controls!');
} else {
  console.warn('Could not find oldJsxTarget in admin page');
}

fs.writeFileSync(adminPath, content, 'utf8');
console.log('Admin page saved successfully.');
