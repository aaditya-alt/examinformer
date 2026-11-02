import sys, os, json, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = 'https://gstoqyvnwpvhciidmigt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA'

with open('src/data/ssc_selection_post_all_shifts.json', 'r', encoding='utf-8') as f:
    shifts_dict = json.load(f)

all_db_rows = []
for slug, sdata in shifts_dict.items():
    for qnum_str, q in sdata['questions'].items():
        all_db_rows.append({
            'id': q['id'],
            'test_id': q['test_id'],
            'question_number': q['question_number'],
            'question_text_en': q['question_text_en'],
            'question_text_hi': q['question_text_hi'],
            'options': q['options'],
            'correct_option_index': q['correct_option_index'],
            'explanation_en': q['explanation_en'],
            'explanation_hi': q['explanation_hi']
        })

print(f"Total rows to upsert to Supabase: {len(all_db_rows)}")

batch_size = 100
batches = [all_db_rows[i:i+batch_size] for i in range(0, len(all_db_rows), batch_size)]

def upsert_batch(b_idx, batch):
    url = f"{SUPABASE_URL}/rest/v1/questions"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
    }
    data = json.dumps(batch).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return len(batch)
    except Exception as e:
        print(f"Batch {b_idx} error: {e}")
        return 0

success = 0
with ThreadPoolExecutor(max_workers=6) as executor:
    futures = [executor.submit(upsert_batch, i, b) for i, b in enumerate(batches)]
    for f in as_completed(futures):
        success += f.result()

print(f"Upserted {success}/{len(all_db_rows)} questions successfully into Supabase!")
