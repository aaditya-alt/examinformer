const fs = require('fs');

const bundle = JSON.parse(fs.readFileSync('d:/ERP/mockmatrix/src/data/mock-tests-bundle.json', 'utf8'));

let sql = `-- ====================================================================
-- SEED DATA: OFFICIAL SSC CGL & RRB NTPC MOCK TESTS (150 QUESTIONS)
-- Generated automatically from official response sheet extractions
-- ====================================================================

`;

for (const test of bundle) {
  sql += `-- TEST: ${test.title}\n`;
  sql += `INSERT INTO public.tests (id, exam_code, title, type, duration_minutes, total_marks, total_questions, is_published)\n`;
  sql += `VALUES ('${test.id}', '${test.examCode}', '${test.title.replace(/'/g, "''")}', '${test.type}', ${test.durationMinutes}, ${test.totalMarks}, ${test.totalQuestions}, true)\n`;
  sql += `ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;\n\n`;

  for (let sIdx = 0; sIdx < test.sections.length; sIdx++) {
    const sec = test.sections[sIdx];
    sql += `INSERT INTO public.test_sections (id, test_id, name, order_index, marks_per_question, negative_marks)\n`;
    sql += `VALUES ('${sec.id}', '${test.id}', '${sec.name.replace(/'/g, "''")}', ${sIdx}, ${test.examFamily === 'ssc' ? 2 : 1}, ${test.examFamily === 'ssc' ? 0.5 : 0.33})\n`;
    sql += `ON CONFLICT (id) DO NOTHING;\n\n`;

    for (const q of sec.questions) {
      const qTextEn = (q.questionText || '').replace(/'/g, "''");
      const qTextHi = (q.questionTextHi || '').replace(/'/g, "''");
      const explanation = (q.explanation || '').replace(/'/g, "''");
      const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");

      sql += `INSERT INTO public.questions (id, test_id, section_id, question_number, question_text_en, question_text_hi, options, correct_option_index, explanation_en)\n`;
      sql += `VALUES ('${q.id}', '${test.id}', '${sec.id}', ${q.qno}, '${qTextEn}', '${qTextHi}', '${optionsJson}'::jsonb, ${q.correctOption}, '${explanation}')\n`;
      sql += `ON CONFLICT (id) DO NOTHING;\n`;
    }
    sql += `\n`;
  }
}

fs.writeFileSync('d:/ERP/mockmatrix/supabase/seed.sql', sql, 'utf8');
console.log('Successfully written supabase/seed.sql!');
