import sys, json
sys.stdout.reconfigure(encoding='utf-8')

data = json.load(open('src/data/ssc_selection_post_all_shifts.json', encoding='utf-8'))
print(f"Total shifts in JSON: {len(data)}")

for test_id, tdata in data.items():
    questions = tdata.get('questions', {})
    total = len(questions)
    hi_q_count = 0
    hi_opt_count = 0
    hi_exp_count = 0
    for qno, q in questions.items():
        q_hi = q.get('question_text_hi') or ''
        q_en = q.get('question_text_en') or ''
        if q_hi and q_hi.strip() != q_en.strip():
            hi_q_count += 1
        
        opts = q.get('options') or []
        opts_translated = False
        for o in opts:
            t_hi = o.get('text_hi') or ''
            t_en = o.get('text_en') or ''
            if t_hi and t_hi.strip() != t_en.strip():
                opts_translated = True
                break
        if opts_translated:
            hi_opt_count += 1

        exp_hi = q.get('explanation_hi') or ''
        exp_en = q.get('explanation_en') or ''
        if exp_hi and exp_hi.strip() != exp_en.strip():
            hi_exp_count += 1

    print(f"{test_id}: {total} Qs | Hindi Qs: {hi_q_count} | Hindi Opts: {hi_opt_count} | Hindi Explanations: {hi_exp_count}")
