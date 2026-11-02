import sys, os, re, json, time
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

gk_path = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-ENGLISH.pdf"
dataset_path = r"d:\ERP\mockmatrix\src\data\ssc_selection_post_all_shifts.json"

if not os.path.exists(dataset_path):
    print(f"Error: {dataset_path} does not exist!", flush=True)
    sys.exit(1)

with open(dataset_path, 'r', encoding='utf-8') as f:
    dataset = json.load(f)

print(f"Loaded existing dataset with {len(dataset)} shifts.", flush=True)

def clean_text(text):
    text = re.sub(r"\[PAGE_\d+_(?:LEFT|RIGHT)\]", "", text)
    text = re.sub(r"MOCKMATRIX[\s\S]*?PERFECTION", "", text)
    text = re.sub(r"SSC\s+2026[\s\S]*?AWARENESS", "", text)
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

def get_shift_info(level_raw, date_raw, shift_raw):
    level = level_raw.lower().strip()
    if 'grad' in level:
        level_clean = 'grad'
    elif '12' in level or 'higher' in level or 'ug' in level:
        level_clean = '12th'
    else:
        level_clean = '10th'

    d_match = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", date_raw)
    if d_match:
        day = d_match.group(1).zfill(2)
        month = d_match.group(2)[:3].lower()
        date_slug = f"{day}{month}"
    else:
        date_slug = "sep"

    s_match = re.search(r"(\d+)", shift_raw)
    shift_num = s_match.group(1)[0] if s_match else "1"
    
    return f"ssc-selection-post-phase-14-{level_clean}-{date_slug}-shift-{shift_num}"

shift_pattern = re.compile(
    r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
    re.IGNORECASE
)

print(f"Reading GK PDF ({os.path.basename(gk_path)})...", flush=True)
all_pages_text = []
with pdfplumber.open(gk_path) as pdf:
    total_p = len(pdf.pages)
    for idx in range(total_p):
        p = pdf.pages[idx]
        w = p.width
        h = p.height
        left = p.crop((0, 0, w / 2, h)).extract_text(layout=False) or ""
        right = p.crop((w / 2, 0, w, h)).extract_text(layout=False) or ""
        all_pages_text.append(left)
        all_pages_text.append(right)
        if (idx + 1) % 50 == 0 or idx + 1 == total_p:
            print(f"  Extracted {idx+1}/{total_p} pages...", flush=True)

full_text = "\n".join(all_pages_text)

q_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text))
print(f"Found {len(q_matches)} Q headers in GK", flush=True)

shift_gk_map = {}

for i in range(len(q_matches)):
    start = q_matches[i].start()
    end = q_matches[i+1].start() if i + 1 < len(q_matches) else len(full_text)
    chunk = full_text[start:end]
    
    m_shift = shift_pattern.search(chunk)
    if not m_shift:
        continue
        
    tid = get_shift_info(m_shift.group(1), m_shift.group(2), m_shift.group(3))
    
    s_idx = chunk.find(m_shift.group(0))
    q_body = clean_text(re.sub(r"^Q\.\d+\s*", "", chunk[:s_idx]).strip())
    
    after_shift = chunk[s_idx + len(m_shift.group(0)):]
    
    opt_end_m = re.search(r"(?:Explanation|Important\s+Facts|Vocab\s+Meanings|✔\s*Answer:)", after_shift)
    if opt_end_m:
        options_raw = after_shift[:opt_end_m.start()]
    else:
        options_raw = after_shift
        
    opts = extract_options(options_raw)
    
    ans_m = re.search(r"✔\s*Answer:\s*\(([A-Da-d])\)", chunk)
    correct_idx = 0
    if ans_m:
        let = ans_m.group(1).upper()
        correct_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}.get(let, 0)
        
    exp_text = ""
    exp_m = re.search(r"(?:Explanation|Important\s+Facts)([\s\S]+?)(?:✔\s*Answer:|\Z)", chunk)
    if exp_m:
        exp_text = clean_text(exp_m.group(1))
        
    if tid not in shift_gk_map:
        shift_gk_map[tid] = []
        
    shift_gk_map[tid].append({
        'body': q_body,
        'options': opts,
        'correct_option': correct_idx,
        'explanation': exp_text
    })

print(f"\nGrouped GK questions across {len(shift_gk_map)} shifts.", flush=True)

# Merge GK questions (offset 26 to 50) into existing dataset
for tid, qlist in shift_gk_map.items():
    if tid in dataset:
        for rel_idx, q_data in enumerate(qlist[:25]):
            abs_qno = 26 + rel_idx
            dataset[tid]['questions'][str(abs_qno)] = {
                'id': f"{tid}-q{abs_qno}",
                'test_id': tid,
                'question_number': abs_qno,
                'section_name': 'General Awareness',
                'question_text_en': q_data['body'] or f"Question {abs_qno} (General Awareness)",
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
                'has_image': False
            }

# Verify and save
total_qs = 0
for tid, tdata in sorted(dataset.items()):
    c = len(tdata['questions'])
    total_qs += c
    print(f"  {tdata['title']}: {c}/100 questions", flush=True)

print(f"\nTotal questions across all 27 tests after merging GK: {total_qs}", flush=True)

with open(dataset_path, 'w', encoding='utf-8') as f:
    json.dump(dataset, f, indent=2, ensure_ascii=False)

print(f"Updated dataset saved successfully to {dataset_path}!", flush=True)
