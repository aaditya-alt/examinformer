import sys, os, re, pymupdf, json, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://gstoqyvnwpvhciidmigt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA'

WATERMARK_PATTERNS = [
    r"\[PAGE_\d+_(?:LEFT|RIGHT)\]",
    r"MOCK\s*MATRIX[\s\S]*?PERFECTION",
    r"MOCK\s*MATRIX",
    r"PRACTICE\s+TO\s+PERFECTION",
    r"SELECTION-POST",
    r"SELECTION\s+POST",
    r"YouTube",
    r"Telegram",
    r"Download\s+App",
    r"Visit\s+Website",
    r"CLICK\s+HERE",
    r"Click\s+to\s+Attempt",
    r"Jump\s+To",
    r"SSC\s+COMPILATION\s+X\s+MMH",
    r"JOIN\s+SSC\s+COMPILATIONS\s+CLICK\s+HERE",
    r"S\s+S\s+C\s+2\s+0\s+2\s+6[\s\S]*?Weightage",
    r"Attempt\s+Part\s+\d+\s+Mock",
    r"P\s+A\s+R\s+T\s+\d+",
    r"Visit:\s*https?://\S+",
    r"https?://\S+",
    r"t\.me/\S+",
    r"Click\s+here\s+to\s+join",
]

def clean_watermark(text):
    if not text:
        return ""
    cleaned = text
    for pat in WATERMARK_PATTERNS:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)
    # clean extra spaces and multiple blank lines
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()

shift_pattern = re.compile(
    r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
    re.IGNORECASE
)

def get_shift_slug(level_raw, date_raw, shift_raw):
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

def clean_options(lines):
    opts = []
    for l in lines:
        cleaned = clean_watermark(l.strip())
        if not cleaned: continue
        # Ignore standalone A, B, C, D
        if cleaned in ['A', 'B', 'C', 'D', '1', '2', '3', '4']: continue
        # Ignore navigation / header lines
        if any(w in cleaned.lower() for w in ['click', 'attempt', 'jump', 'telegram', 'youtube', 'mock matrix', 'selection post', 'page', 'chapter']):
            continue
        opts.append(cleaned)
    return opts

# 1. Parse Two-Column Subjects (Math & Reasoning)
def parse_two_column_pdf(pdf_path):
    doc = pymupdf.open(pdf_path)
    all_chunks = []
    total_p = len(doc)
    print(f"Reading two-column PDF: {os.path.basename(pdf_path)} ({total_p} pages)...")
    for pno in range(total_p):
        p = doc[pno]
        w, h = p.rect.width, p.rect.height
        left = p.get_text(clip=pymupdf.Rect(0, 0, w/2, h))
        right = p.get_text(clip=pymupdf.Rect(w/2, 0, w, h))
        all_chunks.append(f"\n[PAGE_{pno+1}_LEFT]\n" + left)
        all_chunks.append(f"\n[PAGE_{pno+1}_RIGHT]\n" + right)

    full_text = "\n".join(all_chunks)
    
    # Parse explanations: Q.N Right option (X): ...
    exp_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*\n?Right\s+option\s*\(([A-Da-d1-4])\)\s*:\s*([^\n]+)", full_text))
    explanations = {}
    for em in exp_matches:
        q_idx = em.group(1)
        start_p = em.start()
        chunk = full_text[start_p:start_p+1400]
        end_exp = re.search(r"(?:✔\s*Answer:[^\n]+|Right\s+option[^\n]+|Q\.\d+)", chunk[50:])
        exp_text = chunk[:50 + end_exp.start()] if end_exp else chunk[:600]
        explanations[q_idx] = clean_watermark(exp_text)

    q_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text))
    shift_qs = {}
    
    for i in range(len(q_matches)):
        start = q_matches[i].start()
        end = q_matches[i+1].start() if i+1 < len(q_matches) else len(full_text)
        chunk = full_text[start:end]
        
        if "Right option (" in chunk or "✔ Answer:" in chunk:
            continue
            
        m_shift = shift_pattern.search(chunk)
        if not m_shift:
            continue
            
        slug = get_shift_slug(m_shift.group(1), m_shift.group(2), m_shift.group(3))
        if slug not in shift_qs:
            shift_qs[slug] = []
            
        shift_line = m_shift.group(0)
        idx_shift = chunk.find(shift_line)
        before = chunk[:idx_shift]
        after = chunk[idx_shift + len(shift_line):]
        
        q_num = q_matches[i].group(1)
        body = re.sub(r"^Q\.\d+\s*", "", before).strip()
        body = clean_watermark(body)
        
        opts = clean_options(after.strip().split('\n'))[:4]
        while len(opts) < 4:
            opts.append(f"विकल्प {chr(65+len(opts))}")
            
        exp = explanations.get(q_num, "")
        
        shift_qs[slug].append({
            'q_num': q_num,
            'body_hi': body,
            'options_hi': opts,
            'explanation_hi': exp
        })
        
    return shift_qs

# 2. Parse Single-Column Subject (GK)
def parse_single_column_gk(pdf_path):
    doc = pymupdf.open(pdf_path)
    all_chunks = []
    total_p = len(doc)
    print(f"Reading single-column PDF: {os.path.basename(pdf_path)} ({total_p} pages)...")
    for pno in range(total_p):
        all_chunks.append(doc[pno].get_text())

    full_text = "\n".join(all_chunks)
    q_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text))
    shift_qs = {}
    
    for i in range(len(q_matches)):
        start = q_matches[i].start()
        end = q_matches[i+1].start() if i+1 < len(q_matches) else len(full_text)
        chunk = full_text[start:end]
        
        m_shift = shift_pattern.search(chunk)
        if not m_shift:
            continue
            
        slug = get_shift_slug(m_shift.group(1), m_shift.group(2), m_shift.group(3))
        if slug not in shift_qs:
            shift_qs[slug] = []
            
        shift_line = m_shift.group(0)
        idx_shift = chunk.find(shift_line)
        before = chunk[:idx_shift]
        after = chunk[idx_shift + len(shift_line):]
        
        q_num = q_matches[i].group(1)
        body = re.sub(r"^Q\.\d+\s*", "", before).strip()
        body = clean_watermark(body)
        
        # Split after by 'Explanation'
        exp_idx = after.find("Explanation")
        if exp_idx != -1:
            opts_raw = after[:exp_idx]
            exp_raw = after[exp_idx:]
        else:
            opts_raw = after
            exp_raw = ""
            
        opts = clean_options(opts_raw.strip().split('\n'))[:4]
        while len(opts) < 4:
            opts.append(f"विकल्प {chr(65+len(opts))}")
            
        # Clean explanation
        exp_clean = clean_watermark(exp_raw)
        
        shift_qs[slug].append({
            'q_num': q_num,
            'body_hi': body,
            'options_hi': opts,
            'explanation_hi': exp_clean
        })
        
    return shift_qs

def update_supabase_batch(updates):
    # Concurrently update Supabase questions
    def worker(item):
        tid, qno, patch = item
        url = f"{SUPABASE_URL}/rest/v1/questions?test_id=eq.{tid}&question_number=eq.{qno}"
        payload = json.dumps(patch).encode('utf-8')
        req = urllib.request.Request(url, data=payload, method='PATCH', headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        })
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    return True
            except Exception as e:
                if attempt == 2:
                    print(f"Supabase update error {tid} Q{qno}: {e}")
                time.sleep(0.5)
        return False

    print(f"Syncing {len(updates)} question updates to Supabase...")
    success = 0
    with ThreadPoolExecutor(max_workers=15) as executor:
        futures = [executor.submit(worker, up) for up in updates]
        for fut in as_completed(futures):
            if fut.result(): success += 1
            if success % 250 == 0:
                print(f"  Synced {success}/{len(updates)} questions to Supabase...", flush=True)
    print(f"Supabase sync complete: {success}/{len(updates)} updated successfully.")

def main():
    json_path = os.path.join(os.path.dirname(__file__), '../src/data/ssc_selection_post_all_shifts.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        shifts = json.load(f)

    # 1. Parse all 3 Hindi PDFs
    reasoning_shifts = parse_two_column_pdf(r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE HINDI.pdf")
    gk_shifts = parse_single_column_gk(r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-HINDI.pdf")
    math_shifts = parse_two_column_pdf(r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST 14 MATH CHAPTER WISE HINDI.pdf")

    supabase_updates = []
    total_questions_updated = 0

    for s_key, shift_data in shifts.items():
        qs_dict = shift_data.get('questions', {})
        
        # Section A: Reasoning (Q1-25)
        res_list = reasoning_shifts.get(s_key, [])
        # Section B: GK (Q26-50)
        gk_list = gk_shifts.get(s_key, [])
        # Section C: Math (Q51-75)
        math_list = math_shifts.get(s_key, [])

        for q_idx in range(1, 26):
            q_key = str(q_idx)
            if q_key in qs_dict and q_idx - 1 < len(res_list):
                h = res_list[q_idx - 1]
                q = qs_dict[q_key]
                if h['body_hi']: q['question_text_hi'] = h['body_hi']
                if h['explanation_hi']: q['explanation_hi'] = h['explanation_hi']
                # Merge options
                for opt_idx, opt in enumerate(q.get('options', [])):
                    if opt_idx < len(h['options_hi']):
                        opt['text_hi'] = h['options_hi'][opt_idx]
                total_questions_updated += 1
                supabase_updates.append((s_key, q_idx, {
                    'question_text_hi': q.get('question_text_hi'),
                    'options': q.get('options'),
                    'explanation_hi': q.get('explanation_hi')
                }))

        for q_idx in range(26, 51):
            q_key = str(q_idx)
            h_idx = q_idx - 26
            if q_key in qs_dict and h_idx < len(gk_list):
                h = gk_list[h_idx]
                q = qs_dict[q_key]
                if h['body_hi']: q['question_text_hi'] = h['body_hi']
                if h['explanation_hi']: q['explanation_hi'] = h['explanation_hi']
                for opt_idx, opt in enumerate(q.get('options', [])):
                    if opt_idx < len(h['options_hi']):
                        opt['text_hi'] = h['options_hi'][opt_idx]
                total_questions_updated += 1
                supabase_updates.append((s_key, q_idx, {
                    'question_text_hi': q.get('question_text_hi'),
                    'options': q.get('options'),
                    'explanation_hi': q.get('explanation_hi')
                }))

        for q_idx in range(51, 76):
            q_key = str(q_idx)
            h_idx = q_idx - 51
            if q_key in qs_dict and h_idx < len(math_list):
                h = math_list[h_idx]
                q = qs_dict[q_key]
                if h['body_hi']: q['question_text_hi'] = h['body_hi']
                if h['explanation_hi']: q['explanation_hi'] = h['explanation_hi']
                for opt_idx, opt in enumerate(q.get('options', [])):
                    if opt_idx < len(h['options_hi']):
                        opt['text_hi'] = h['options_hi'][opt_idx]
                total_questions_updated += 1
                supabase_updates.append((s_key, q_idx, {
                    'question_text_hi': q.get('question_text_hi'),
                    'options': q.get('options'),
                    'explanation_hi': q.get('explanation_hi')
                }))

    # Save to JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(shifts, f, ensure_ascii=False, indent=2)
    print(f"\nSaved updated {len(shifts)} shifts with {total_questions_updated} Hindi questions to {json_path}!")

    # Sync to Supabase
    update_supabase_batch(supabase_updates)

if __name__ == '__main__':
    main()
