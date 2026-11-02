import sys, os, re, json, time
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

PDF_CONFIGS = [
    {
        'subject': 'Reasoning',
        'section_name': 'General Intelligence & Reasoning',
        'q_start': 1,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE ENGLISH (1).pdf"
    },
    {
        'subject': 'GK',
        'section_name': 'General Awareness',
        'q_start': 26,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-ENGLISH.pdf"
    },
    {
        'subject': 'Math',
        'section_name': 'Quantitative Aptitude',
        'q_start': 51,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST 14 MATH CHAPTER WISE ENGLISH.pdf"
    },
    {
        'subject': 'English',
        'section_name': 'English Comprehension',
        'q_start': 76,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 ENGLISH LANGUAGE CHAPTER WISE.pdf"
    }
]

def clean_text(text):
    text = re.sub(r"\[PAGE_\d+_(?:LEFT|RIGHT)\]", "", text)
    text = re.sub(r"MOCKMATRIX[\s\S]*?PERFECTION", "", text)
    text = re.sub(r"SELECTION-POST", "", text)
    return text.strip()

def extract_options(options_text):
    m1 = re.search(r"(?:^|\n)\s*A\s+([\s\S]+?)\s+B\s+([\s\S]+?)(?=\n\s*C\s+|\Z)", options_text)
    m2 = re.search(r"(?:^|\n)\s*C\s+([\s\S]+?)\s+D\s+([\s\S]+?)$", options_text)
    if m1 and m2:
        return [
            m1.group(1).strip(),
            m1.group(2).strip(),
            m2.group(1).strip(),
            m2.group(2).strip()
        ]
    m = re.findall(r"(?:^|\n)\s*([A-D])\s+([\s\S]+?)(?=(?:\n\s*[A-D]\s+)|\Z)", options_text)
    if len(m) >= 4:
        return [item[1].strip() for item in m[:4]]
    lines = [l.strip() for l in options_text.split('\n') if l.strip()]
    while len(lines) < 4:
        lines.append(f"Option {chr(65+len(lines))}")
    return lines[:4]

def is_diagram_question(text):
    t = text.lower()
    triggers = [
        "figure", "mirror image", "water image", "paper folded", "folded and cut",
        "embedded in the given", "venn diagram", "select the figure", "pattern in the figure",
        "following figure", "given figure", "triangle in the given", "square in the given"
    ]
    return any(trig in t for trig in triggers)

def get_shift_info(level_raw, date_raw, shift_raw):
    level = level_raw.lower().strip()
    if 'grad' in level:
        level_clean = 'grad'
        level_display = 'Graduate'
    elif '12' in level or 'higher' in level or 'ug' in level:
        level_clean = '12th'
        level_display = 'Higher Secondary (12th)'
    else:
        level_clean = '10th'
        level_display = 'Matriculation (10th)'

    d_match = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", date_raw)
    if d_match:
        day = d_match.group(1).zfill(2)
        month = d_match.group(2)[:3].lower()
        year = d_match.group(3)
        date_slug = f"{day}{month}"
        date_display = f"{int(d_match.group(1))} {d_match.group(2).title()} {year}"
    else:
        date_slug = "sep"
        date_display = date_raw.strip()

    s_match = re.search(r"(\d+)", shift_raw)
    shift_num = s_match.group(1)[0] if s_match else "1"
    
    test_id = f"ssc-selection-post-phase-14-{level_clean}-{date_slug}-shift-{shift_num}"
    test_title = f"SSC Selection Post Phase 14 ({level_display}) {date_display} Shift {shift_num}"
    
    return {
        'test_id': test_id,
        'test_title': test_title,
        'level': level_clean,
        'level_display': level_display,
        'date_display': date_display,
        'shift_num': int(shift_num)
    }

shift_pattern = re.compile(
    r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
    re.IGNORECASE
)

# Structure to hold 27 full tests
# test_id -> { metadata, questions: [None] * 100 }
tests_dataset = {}

for cfg in PDF_CONFIGS:
    subj = cfg['subject']
    sec_name = cfg['section_name']
    q_start = cfg['q_start'] # 1, 26, 51, 76
    path = cfg['path']
    
    print(f"\n==========================================", flush=True)
    print(f"Processing Subject: {subj} (Questions {q_start} to {q_start + 24})", flush=True)
    print(f"Reading: {os.path.basename(path)}", flush=True)
    
    all_pages_text = []
    with pdfplumber.open(path) as pdf:
        total_p = len(pdf.pages)
        for idx in range(total_p):
            p = pdf.pages[idx]
            w = p.width
            h = p.height
            left = p.crop((0, 0, w / 2, h)).extract_text(layout=False) or ""
            right = p.crop((w / 2, 0, w, h)).extract_text(layout=False) or ""
            all_pages_text.append(f"\n[PAGE_{idx+1}_LEFT]\n" + left)
            all_pages_text.append(f"\n[PAGE_{idx+1}_RIGHT]\n" + right)
            if (idx + 1) % 50 == 0 or idx + 1 == total_p:
                print(f"  Extracted {idx+1}/{total_p} pages...", flush=True)

    full_subject_text = "\n".join(all_pages_text)
    
    # Split by chapters or look for questions
    # Find all question blocks
    q_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_subject_text))
    print(f"  Total Q. headers found in {subj}: {len(q_matches)}", flush=True)
    
    # Also extract all explanation / answer key maps
    # An explanation block starts with: Q.(\d+)\s*\n?Right option\s*\(([A-Da-d])\)\s*:\s*([^\n]+)
    # Or: ✔ Answer: \(([A-Da-d])\)
    explanations_by_text = {}
    exp_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*\n?Right\s+option\s*\(([A-Da-d])\)\s*:\s*([^\n]+)", full_subject_text))
    for em in exp_matches:
        q_header = em.group(0)
        correct_letter = em.group(2).upper()
        # Find explanation text
        start_p = em.start()
        # take up to next Q. or next header
        chunk = full_subject_text[start_p:start_p+800]
        end_exp = re.search(r"(?:✔\s*Answer:[^\n]+|Right\s+option[^\n]+)", chunk[50:])
        exp_text = chunk[:50 + end_exp.end()] if end_exp else chunk[:400]
        explanations_by_text[em.group(1)] = {
            'letter': correct_letter,
            'exp': clean_text(exp_text)
        }

    # Answer keys map
    ans_key_map = {}
    for ak in re.finditer(r"(\d+)\s*\(([a-d1-4])\)", full_subject_text, re.IGNORECASE):
        q_idx = ak.group(1)
        let = ak.group(2).lower()
        map_let = {'a': 0, 'b': 1, 'c': 2, 'd': 3, '1': 0, '2': 1, '3': 2, '4': 3}
        ans_key_map[q_idx] = map_let.get(let, 0)
        
    # Group questions by shift
    shift_qs_map = {}
    for i in range(len(q_matches)):
        start = q_matches[i].start()
        end = q_matches[i+1].start() if i + 1 < len(q_matches) else len(full_subject_text)
        chunk = full_subject_text[start:end]
        
        # Skip explanation chunks
        if "Right option (" in chunk or "✔ Answer:" in chunk:
            continue
            
        m_shift = shift_pattern.search(chunk)
        if not m_shift:
            continue
            
        shift_meta = get_shift_info(m_shift.group(1), m_shift.group(2), m_shift.group(3))
        tid = shift_meta['test_id']
        
        if tid not in shift_qs_map:
            shift_qs_map[tid] = []
            
        # Parse question text and options
        # Everything before the shift line is the question body
        shift_line_idx = chunk.find(m_shift.group(0))
        before_shift = chunk[:shift_line_idx]
        after_shift = chunk[shift_line_idx + len(m_shift.group(0)):]
        
        # Question text: strip Q.N
        q_body = re.sub(r"^Q\.\d+\s*", "", before_shift).strip()
        q_body = clean_text(q_body)
        
        # Options
        opts = extract_options(after_shift)
        
        # Correct answer
        chapter_q_num = q_matches[i].group(1)
        correct_idx = 0
        if chapter_q_num in ans_key_map:
            correct_idx = ans_key_map[chapter_q_num]
        elif chapter_q_num in explanations_by_text:
            let = explanations_by_text[chapter_q_num]['letter']
            correct_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}.get(let, 0)
            
        # Explanation
        exp_text = ""
        if chapter_q_num in explanations_by_text:
            exp_text = explanations_by_text[chapter_q_num]['exp']
            
        has_img = is_diagram_question(q_body)
        
        shift_qs_map[tid].append({
            'body': q_body,
            'options': opts,
            'correct_option': correct_idx,
            'explanation': exp_text,
            'has_image': has_img,
            'shift_meta': shift_meta
        })

    print(f"  Assigned {subj} questions across {len(shift_qs_map)} shifts.", flush=True)
    
    # Store into tests_dataset
    for tid, qlist in shift_qs_map.items():
        if tid not in tests_dataset:
            meta = qlist[0]['shift_meta']
            tests_dataset[tid] = {
                'id': tid,
                'title': meta['test_title'],
                'exam_code': 'ssc-selection-post',
                'level': meta['level'],
                'level_display': meta['level_display'],
                'date_display': meta['date_display'],
                'shift_num': meta['shift_num'],
                'questions': {}
            }
            
        # Place questions in offset (e.g. Reasoning: 1..25, GK: 26..50, Math: 51..75, English: 76..100)
        for rel_idx, q_data in enumerate(qlist[:25]):
            abs_qno = q_start + rel_idx
            tests_dataset[tid]['questions'][abs_qno] = {
                'id': f"{tid}-q{abs_qno}",
                'test_id': tid,
                'question_number': abs_qno,
                'section_name': sec_name,
                'question_text_en': q_data['body'] or f"Question {abs_qno} ({sec_name})",
                'question_text_hi': '',
                'options': [
                    {'id': 'a', 'text_en': q_data['options'][0], 'text_hi': ''},
                    {'id': 'b', 'text_en': q_data['options'][1], 'text_hi': ''},
                    {'id': 'c', 'text_en': q_data['options'][2], 'text_hi': ''},
                    {'id': 'd', 'text_en': q_data['options'][3], 'text_hi': ''}
                ],
                'correct_option_index': q_data['correct_option'],
                'explanation_en': q_data['explanation'],
                'explanation_hi': '',
                'has_image': q_data['has_image']
            }

print(f"\n==========================================", flush=True)
print(f"Aggregation complete: {len(tests_dataset)} total shifts built.", flush=True)

# Validate question count per test
summary_list = []
total_all_qs = 0
for tid, tdata in sorted(tests_dataset.items()):
    q_count = len(tdata['questions'])
    total_all_qs += q_count
    summary_list.append({
        'id': tid,
        'title': tdata['title'],
        'level': tdata['level'],
        'question_count': q_count
    })
    print(f"  {tdata['title']}: {q_count}/100 questions", flush=True)

print(f"\nTotal questions prepared across all tests: {total_all_qs}", flush=True)

# Save to JSON file
out_path = r"d:\ERP\mockmatrix\src\data\ssc_selection_post_all_shifts.json"
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(tests_dataset, f, indent=2, ensure_ascii=False)

print(f"Dataset successfully saved to: {out_path}", flush=True)
