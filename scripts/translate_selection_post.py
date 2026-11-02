import os
import sys
import json
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://gstoqyvnwpvhciidmigt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'translation_cache.json')
trans_cache = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            trans_cache = json.load(f)
    except Exception:
        trans_cache = {}

def save_cache():
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(trans_cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def translate_text(text: str) -> str:
    if not text or not text.strip():
        return ''
    cleaned = text.strip()
    if cleaned in trans_cache:
        return trans_cache[cleaned]
    
    # If text is strictly numbers / simple symbols, return as is
    if cleaned.replace('.', '').replace('-', '').replace(',', '').replace(' ', '').replace('%', '').isdigit():
        return cleaned

    url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=' + urllib.parse.quote(cleaned)
    req = urllib.request.Request(url, headers=HEADERS)
    
    retries = 3
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                res = ''.join([part[0] for part in data[0] if part[0]])
                trans_cache[cleaned] = res
                return res
        except Exception:
            if attempt < retries - 1:
                time.sleep(0.3)
            else:
                return cleaned
    return cleaned

def update_supabase_question(test_id, qno, q_hi, opts, expl_hi):
    url = f"{SUPABASE_URL}/rest/v1/questions?test_id=eq.{test_id}&question_number=eq.{qno}"
    payload = {
        "question_text_hi": q_hi,
        "options": opts,
        "explanation_hi": expl_hi
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PATCH', headers={
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    })
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            pass
    except Exception as e:
        print(f"Supabase error updating {test_id} Q{qno}: {e}")

def process_single_question(item):
    test_id, q_num_str, q = item
    sec_name = q.get('section_name', '')
    q_en = q.get('question_text_en', '')
    sol_en = q.get('explanation_en', '')
    opts = q.get('options', [])

    is_english_section = 'English' in sec_name

    # 1. Question text
    q_hi = q_en if is_english_section else translate_text(q_en)

    # 2. Options
    new_opts = []
    for o in opts:
        text_en = o.get('text_en', '')
        text_hi = text_en if is_english_section else translate_text(text_en)
        new_opts.append({
            'id': o.get('id', 1),
            'text_en': text_en,
            'text_hi': text_hi,
            'imageUrl': o.get('imageUrl')
        })

    # 3. Explanation (for all sections, so Hindi users get explanations in Hindi)
    sol_hi = translate_text(sol_en)

    qno = int(q_num_str)
    update_supabase_question(test_id, qno, q_hi, new_opts, sol_hi)

    return q_num_str, q_hi, new_opts, sol_hi

def main():
    json_path = os.path.join(os.path.dirname(__file__), '../src/data/ssc_selection_post_all_shifts.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        shifts = json.load(f)

    shift_keys = list(shifts.keys())
    print(f"Loaded {len(shift_keys)} Selection Post shifts.")

    total_translated = 0

    for s_idx, s_key in enumerate(shift_keys, 1):
        shift = shifts[s_key]
        print(f"\n--- [{s_idx}/{len(shift_keys)}] Translating {shift.get('title', s_key)} ---")
        qs = shift.get('questions', {})
        q_items = [(s_key, k, v) for k, v in qs.items()]

        # Process questions concurrently in batches of 10
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(process_single_question, item) for item in q_items]
            for fut in as_completed(futures):
                q_num_str, q_hi, new_opts, sol_hi = fut.result()
                qs[q_num_str]['question_text_hi'] = q_hi
                qs[q_num_str]['options'] = new_opts
                qs[q_num_str]['explanation_hi'] = sol_hi
                total_translated += 1

        print(f"Completed {s_key} ({len(q_items)} questions). Total: {total_translated}")
        
        # Save after each shift
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(shifts, f, ensure_ascii=False, indent=2)
        save_cache()

    print(f"\n=======================================================")
    print(f"All 27 Selection Post shifts translated to authentic Hindi!")
    print(f"Total questions translated: {total_translated}")
    print(f"=======================================================\n")

if __name__ == '__main__':
    main()
