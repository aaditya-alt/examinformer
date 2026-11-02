import sys, os, re, json, time, pymupdf, urllib.request
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
    r"Quantitative\s+Aptitude",
    r"General\s+Intelligence\s+&\s+Reasoning",
    r"General\s+Awareness",
    r"English\s+Comprehension",
]

def clean_watermarks(text):
    if not text:
        return ""
    cleaned = text
    for pat in WATERMARK_PATTERNS:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    return cleaned.strip()

def normalize_shift_slug(level_raw, date_raw, shift_raw):
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
        date_display = f"{d_match.group(1)} {d_match.group(2).title()} {year}"
    else:
        date_slug = "sep"
        date_display = date_raw.strip()

    s_match = re.search(r"(\d+)", shift_raw)
    shift_num = s_match.group(1)[0] if s_match else "1"

    return f"ssc-selection-post-phase-14-{level_clean}-{date_slug}-shift-{shift_num}", {
        'level_clean': level_clean,
        'level_display': level_display,
        'date_display': date_display,
        'shift_num': int(shift_num)
    }

def extract_column_lines(page, col_rect):
    words = page.get_text("words", clip=col_rect)
    if not words:
        return []
    words.sort(key=lambda w: (w[1], w[0]))
    lines = []
    curr_line = []
    curr_y = None
    for w in words:
        y = w[1]
        if curr_y is None or abs(y - curr_y) <= 4.0:
            curr_line.append(w)
            curr_y = y if curr_y is None else (curr_y + y) / 2.0
        else:
            curr_line.sort(key=lambda x: x[0])
            lines.append(" ".join(x[4] for x in curr_line))
            curr_line = [w]
            curr_y = y
    if curr_line:
        curr_line.sort(key=lambda x: x[0])
        lines.append(" ".join(x[4] for x in curr_line))
    return lines

def extract_page_lines_two_column(page):
    w, h = page.rect.width, page.rect.height
    left_lines = extract_column_lines(page, pymupdf.Rect(0, 0, w / 2.0, h))
    right_lines = extract_column_lines(page, pymupdf.Rect(w / 2.0, 0, w, h))
    return left_lines + right_lines

def parse_options_from_lines(lines):
    raw_text = " ".join(l.strip() for l in lines if l.strip())
    raw_text = clean_watermarks(raw_text)
    
    # Try pattern: A <optA> B <optB> C <optC> D <optD>
    m = re.search(r"(?:^|\b)A[\.\)]?\s+([\s\S]+?)\s+\bB[\.\)]?\s+([\s\S]+?)\s+\bC[\.\)]?\s+([\s\S]+?)\s+\bD[\.\)]?\s+([\s\S]+)$", raw_text)
    if m:
        return [
            re.sub(r"\s+", " ", m.group(1)).strip(),
            re.sub(r"\s+", " ", m.group(2)).strip(),
            re.sub(r"\s+", " ", m.group(3)).strip(),
            re.sub(r"\s+", " ", m.group(4)).strip()
        ]
    
    parts = re.split(r"\b[A-D][\.\)]?\s+", raw_text)
    if len(parts) >= 5:
        return [re.sub(r"\s+", " ", p).strip() for p in parts[1:5]]
        
    valid_lines = [re.sub(r"\s+", " ", l).strip() for l in lines if l.strip() and not any(k in l.lower() for k in ['youtube', 'telegram', 'download', 'visit', 'mock matrix'])]
    while len(valid_lines) < 4:
        valid_lines.append(f"Option {chr(65+len(valid_lines))}")
    return valid_lines[:4]

def is_diagram_question(text):
    t = text.lower()
    triggers = [
        "figure", "image", "mirror image", "water image", "paper folded", "folded and cut",
        "embedded in the given", "venn diagram", "select the figure", "pattern in the figure",
        "following figure", "given figure", "triangle in the given", "square in the given",
        "dice", "cube", "unfolded", "embedded", "rotation", "pattern"
    ]
    return any(trig in t for trig in triggers)

# ── 1. TWO-COLUMN SUBJECT PARSER (Math, Reasoning, English) ──
def parse_two_column_subject(pdf_en_path, pdf_hi_path, subject_name):
    print(f"\n==============================", flush=True)
    print(f"Parsing {subject_name}...", flush=True)
    doc_en = pymupdf.open(pdf_en_path)
    doc_hi = pymupdf.open(pdf_hi_path) if pdf_hi_path else None
    
    # 1. Locate all ANSWER KEY pages in English doc
    ak_pages_en = []
    for pno in range(len(doc_en)):
        if "ANSWER KEY" in doc_en[pno].get_text():
            ak_pages_en.append(pno)
    print(f"[{subject_name}] Found {len(ak_pages_en)} chapters in English PDF.", flush=True)
    
    ak_pages_hi = []
    if doc_hi:
        for pno in range(len(doc_hi)):
            txt = doc_hi[pno].get_text()
            if "ANSWER KEY" in txt or "उत्तर कुंजी" in txt:
                ak_pages_hi.append(pno)
        print(f"[{subject_name}] Found {len(ak_pages_hi)} chapters in Hindi PDF.", flush=True)
        
    shift_pattern = re.compile(
        r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
        re.IGNORECASE
    )
    
    all_subject_questions = []
    
    for ch_idx, ak_pno_en in enumerate(ak_pages_en):
        if ch_idx == 0:
            q_start_en = 2
            while q_start_en < ak_pno_en and ("Q.1" not in doc_en[q_start_en].get_text() or "Selection Post" not in doc_en[q_start_en].get_text()):
                q_start_en += 1
        else:
            prev_ak = ak_pages_en[ch_idx - 1]
            q_start_en = prev_ak + 1
            while q_start_en < ak_pno_en and ("Q.1" not in doc_en[q_start_en].get_text() or "Selection Post" not in doc_en[q_start_en].get_text()):
                q_start_en += 1
                
        q_end_en = ak_pno_en
        
        exp_start_en = ak_pno_en
        if ch_idx + 1 < len(ak_pages_en):
            next_ak = ak_pages_en[ch_idx + 1]
            exp_end_en = exp_start_en + 1
            while exp_end_en < next_ak:
                txt = doc_en[exp_end_en].get_text()
                if "Q.1" in txt and "Selection Post" in txt and ("Part" in txt or "CHAPTER" in txt or "SELECTION-POST" in txt):
                    break
                exp_end_en += 1
        else:
            exp_end_en = len(doc_en)
            
        en_q_lines = []
        for p in range(q_start_en, q_end_en):
            en_q_lines.extend(extract_page_lines_two_column(doc_en[p]))
            
        en_exp_text = ""
        for p in range(exp_start_en, exp_end_en):
            en_exp_text += doc_en[p].get_text() + "\n"
            
        ans_key_map = {}
        for m in re.finditer(r"(?:^|\n)\s*(\d+)\s*\(([a-dA-D1-4])\)", en_exp_text):
            ans_key_map[int(m.group(1))] = m.group(2).upper()
            
        exp_en_map = {}
        exp_matches_en = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*(?:\n|Right\s+option)", en_exp_text))
        for em_idx in range(len(exp_matches_en)):
            q_k = int(exp_matches_en[em_idx].group(1))
            st = exp_matches_en[em_idx].start()
            en = exp_matches_en[em_idx+1].start() if em_idx + 1 < len(exp_matches_en) else len(en_exp_text)
            chunk = clean_watermarks(en_exp_text[st:en].strip())
            m_ans = re.search(r"✔\s*Answer:\s*\(([A-Da-d1-4])\)", chunk) or re.search(r"Right\s+option\s*\(([A-Da-d1-4])\)", chunk)
            ans_ch = m_ans.group(1).upper() if m_ans else None
            exp_en_map[q_k] = {
                'explanation': chunk,
                'answer': ans_ch or ans_key_map.get(q_k, 'A')
            }
            
        hi_q_lines = []
        exp_hi_map = {}
        if doc_hi and ch_idx < len(ak_pages_hi):
            ak_pno_hi = ak_pages_hi[ch_idx]
            if ch_idx == 0:
                q_start_hi = 2
                while q_start_hi < ak_pno_hi and ("Q.1" not in doc_hi[q_start_hi].get_text() or "Selection Post" not in doc_hi[q_start_hi].get_text()):
                    q_start_hi += 1
            else:
                prev_ak_hi = ak_pages_hi[ch_idx - 1]
                q_start_hi = prev_ak_hi + 1
                while q_start_hi < ak_pno_hi and ("Q.1" not in doc_hi[q_start_hi].get_text() or "Selection Post" not in doc_hi[q_start_hi].get_text()):
                    q_start_hi += 1
            q_end_hi = ak_pno_hi
            
            exp_start_hi = ak_pno_hi
            if ch_idx + 1 < len(ak_pages_hi):
                next_ak_hi = ak_pages_hi[ch_idx + 1]
                exp_end_hi = exp_start_hi + 1
                while exp_end_hi < next_ak_hi:
                    txt = doc_hi[exp_end_hi].get_text()
                    if "Q.1" in txt and "Selection Post" in txt and ("Part" in txt or "CHAPTER" in txt or "SELECTION-POST" in txt):
                        break
                    exp_end_hi += 1
            else:
                exp_end_hi = len(doc_hi)
                
            for p in range(q_start_hi, q_end_hi):
                hi_q_lines.extend(extract_page_lines_two_column(doc_hi[p]))
                
            hi_exp_text = ""
            for p in range(exp_start_hi, exp_end_hi):
                hi_exp_text += doc_hi[p].get_text() + "\n"
                
            exp_matches_hi = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*(?:\n|Right\s+option)", hi_exp_text))
            for em_idx in range(len(exp_matches_hi)):
                q_k = int(exp_matches_hi[em_idx].group(1))
                st = exp_matches_hi[em_idx].start()
                en = exp_matches_hi[em_idx+1].start() if em_idx + 1 < len(exp_matches_hi) else len(hi_exp_text)
                chunk = clean_watermarks(hi_exp_text[st:en].strip())
                exp_hi_map[q_k] = chunk
                
        en_q_splits = []
        for idx, l in enumerate(en_q_lines):
            qm = re.match(r"^Q\.(\d+)\s*", l)
            if qm:
                en_q_splits.append((idx, int(qm.group(1))))
                
        hi_q_splits = []
        for idx, l in enumerate(hi_q_lines):
            qm = re.match(r"^Q\.(\d+)\s*", l)
            if qm:
                hi_q_splits.append((idx, int(qm.group(1))))
                
        for q_idx in range(len(en_q_splits)):
            q_num = en_q_splits[q_idx][1]
            st_line = en_q_splits[q_idx][0]
            en_line = en_q_splits[q_idx+1][0] if q_idx + 1 < len(en_q_splits) else len(en_q_lines)
            chunk_lines = en_q_lines[st_line:en_line]
            
            shift_match_idx = -1
            shift_info_match = None
            for li, line in enumerate(chunk_lines):
                sm = shift_pattern.search(line)
                if sm:
                    shift_match_idx = li
                    shift_info_match = sm
                    break
                    
            if shift_match_idx == -1:
                continue
                
            shift_slug, s_info = normalize_shift_slug(shift_info_match.group(1), shift_info_match.group(2), shift_info_match.group(3))
            
            body_lines = chunk_lines[:shift_match_idx]
            body_en = " ".join(body_lines)
            body_en = re.sub(r"^Q\.\d+\s*", "", body_en)
            body_en = clean_watermarks(body_en)
            body_en = re.sub(r"\s+", " ", body_en).strip()
            
            opt_lines_en = chunk_lines[shift_match_idx+1:]
            opts_en = parse_options_from_lines(opt_lines_en)
            
            body_hi = body_en
            opts_hi = opts_en
            if q_idx < len(hi_q_splits):
                hi_st = hi_q_splits[q_idx][0]
                hi_en = hi_q_splits[q_idx+1][0] if q_idx + 1 < len(hi_q_splits) else len(hi_q_lines)
                hi_chunk = hi_q_lines[hi_st:hi_en]
                hi_shift_idx = -1
                for hli, hline in enumerate(hi_chunk):
                    if shift_pattern.search(hline):
                        hi_shift_idx = hli
                        break
                if hi_shift_idx != -1:
                    hbody = " ".join(hi_chunk[:hi_shift_idx])
                    hbody = re.sub(r"^Q\.\d+\s*", "", hbody)
                    hbody = clean_watermarks(hbody)
                    hbody = re.sub(r"\s+", " ", hbody).strip()
                    if hbody:
                        body_hi = hbody
                    hopts = parse_options_from_lines(hi_chunk[hi_shift_idx+1:])
                    if hopts and len(hopts) == 4:
                        opts_hi = hopts
                        
            exp_obj = exp_en_map.get(q_num, {})
            ans_letter = exp_obj.get('answer') or ans_key_map.get(q_num, 'A')
            letter_to_idx = {'A': 0, '1': 0, 'B': 1, '2': 1, 'C': 2, '3': 2, 'D': 3, '4': 3}
            correct_idx = letter_to_idx.get(str(ans_letter).upper(), 0)
            
            exp_en = exp_obj.get('explanation', '')
            exp_hi = exp_hi_map.get(q_num, exp_en)
            
            has_img = is_diagram_question(body_en)
            
            all_subject_questions.append({
                'subject': subject_name,
                'shift_slug': shift_slug,
                'shift_info': s_info,
                'body_en': body_en,
                'body_hi': body_hi,
                'options_en': opts_en,
                'options_hi': opts_hi,
                'correct_option_index': correct_idx,
                'explanation_en': exp_en,
                'explanation_hi': exp_hi,
                'has_image': has_img
            })
            
    print(f"[{subject_name}] Finished parsing: {len(all_subject_questions)} questions extracted.", flush=True)
    return all_subject_questions

# ── 2. GK SUBJECT PARSER (Single-Column) ──
def parse_gk_subject(pdf_en_path, pdf_hi_path):
    print(f"\n==============================", flush=True)
    print("Parsing General Awareness (GK)...", flush=True)
    doc_en = pymupdf.open(pdf_en_path)
    doc_hi = pymupdf.open(pdf_hi_path) if pdf_hi_path else None
    
    full_text_en = "\n".join(doc_en[p].get_text() for p in range(len(doc_en)))
    full_text_hi = "\n".join(doc_hi[p].get_text() for p in range(len(doc_hi))) if doc_hi else ""
    
    shift_pattern = re.compile(
        r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
        re.IGNORECASE
    )
    
    q_matches_en = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text_en))
    q_matches_hi = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text_hi)) if full_text_hi else []
    
    gk_questions = []
    
    for i in range(len(q_matches_en)):
        st = q_matches_en[i].start()
        en = q_matches_en[i+1].start() if i + 1 < len(q_matches_en) else len(full_text_en)
        chunk = full_text_en[st:en]
        
        m_shift = shift_pattern.search(chunk)
        if not m_shift:
            continue
            
        shift_slug, s_info = normalize_shift_slug(m_shift.group(1), m_shift.group(2), m_shift.group(3))
        shift_line = m_shift.group(0)
        idx_shift = chunk.find(shift_line)
        
        before = chunk[:idx_shift]
        after = chunk[idx_shift + len(shift_line):]
        
        body_en = re.sub(r"^Q\.\d+\s*", "", before).strip()
        body_en = clean_watermarks(body_en)
        body_en = re.sub(r"\s+", " ", body_en).strip()
        
        exp_idx = after.find("Explanation")
        if exp_idx != -1:
            opts_raw = after[:exp_idx]
            exp_raw = after[exp_idx:]
        else:
            opts_raw = after
            exp_raw = ""
            
        opt_lines = [l.strip() for l in opts_raw.split('\n') if l.strip()]
        opts_en = parse_options_from_lines(opt_lines)
        
        m_ans = re.search(r"✔\s*Answer:\s*\(([A-Da-d1-4])\)", exp_raw)
        ans_letter = m_ans.group(1).upper() if m_ans else 'A'
        letter_to_idx = {'A': 0, '1': 0, 'B': 1, '2': 1, 'C': 2, '3': 2, 'D': 3, '4': 3}
        correct_idx = letter_to_idx.get(ans_letter, 0)
        
        exp_en = clean_watermarks(exp_raw.strip())
        
        body_hi = body_en
        opts_hi = opts_en
        exp_hi = exp_en
        
        if i < len(q_matches_hi):
            hi_st = q_matches_hi[i].start()
            hi_en = q_matches_hi[i+1].start() if i + 1 < len(q_matches_hi) else len(full_text_hi)
            hi_chunk = full_text_hi[hi_st:hi_en]
            hi_sm = shift_pattern.search(hi_chunk)
            if hi_sm:
                hi_idx_shift = hi_chunk.find(hi_sm.group(0))
                hi_before = hi_chunk[:hi_idx_shift]
                hi_after = hi_chunk[hi_idx_shift + len(hi_sm.group(0)):]
                hbody = re.sub(r"^Q\.\d+\s*", "", hi_before).strip()
                hbody = clean_watermarks(hbody)
                hbody = re.sub(r"\s+", " ", hbody).strip()
                if hbody:
                    body_hi = hbody
                
                hi_exp_idx = hi_after.find("Explanation")
                if hi_exp_idx != -1:
                    hi_opts_raw = hi_after[:hi_exp_idx]
                    exp_hi = clean_watermarks(hi_after[hi_exp_idx:].strip())
                else:
                    hi_opts_raw = hi_after
                
                hopts = parse_options_from_lines([l.strip() for l in hi_opts_raw.split('\n') if l.strip()])
                if hopts and len(hopts) == 4:
                    opts_hi = hopts
                    
        gk_questions.append({
            'subject': 'General Awareness',
            'shift_slug': shift_slug,
            'shift_info': s_info,
            'body_en': body_en,
            'body_hi': body_hi,
            'options_en': opts_en,
            'options_hi': opts_hi,
            'correct_option_index': correct_idx,
            'explanation_en': exp_en,
            'explanation_hi': exp_hi,
            'has_image': False
        })
        
    print(f"[General Awareness] Finished parsing: {len(gk_questions)} questions extracted.", flush=True)
    return gk_questions

# ── 3. MAIN RUNNER & SUPABASE SYNC ──
def main():
    reasoning_en = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE ENGLISH (1).pdf"
    reasoning_hi = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE HINDI.pdf"
    
    gk_en = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-ENGLISH.pdf"
    gk_hi = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-HINDI.pdf"
    
    math_en = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST 14 MATH CHAPTER WISE ENGLISH.pdf"
    math_hi = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST 14 MATH CHAPTER WISE HINDI.pdf"
    
    english_en = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 ENGLISH LANGUAGE CHAPTER WISE.pdf"
    english_hi = None
    
    reasoning_qs = parse_two_column_subject(reasoning_en, reasoning_hi, "General Intelligence & Reasoning")
    gk_qs = parse_gk_subject(gk_en, gk_hi)
    math_qs = parse_two_column_subject(math_en, math_hi, "Quantitative Aptitude")
    english_qs = parse_two_column_subject(english_en, english_hi, "English Comprehension")
    
    all_qs = reasoning_qs + gk_qs + math_qs + english_qs
    shifts_dict = {}
    
    for q in all_qs:
        slug = q['shift_slug']
        if slug not in shifts_dict:
            s_info = q['shift_info']
            shifts_dict[slug] = {
                'id': slug,
                'title': f"SSC Selection Post Phase 14 ({s_info['level_display']}) {s_info['date_display']} Shift {s_info['shift_num']}",
                'exam_code': 'ssc-selection-post',
                'level': s_info['level_clean'],
                'level_display': s_info['level_display'],
                'date_display': s_info['date_display'],
                'shift_num': s_info['shift_num'],
                'questions': {}
            }
            
    print(f"\nGrouped into {len(shifts_dict)} unique shifts.", flush=True)
    
    for slug, sdata in shifts_dict.items():
        s_reasoning = [q for q in reasoning_qs if q['shift_slug'] == slug]
        s_gk = [q for q in gk_qs if q['shift_slug'] == slug]
        s_math = [q for q in math_qs if q['shift_slug'] == slug]
        s_english = [q for q in english_qs if q['shift_slug'] == slug]
        
        q_counter = 1
        for sec_name, q_list in [
            ("General Intelligence & Reasoning", s_reasoning),
            ("General Awareness", s_gk),
            ("Quantitative Aptitude", s_math),
            ("English Comprehension", s_english)
        ]:
            for item in q_list:
                q_id = f"{slug}-q{q_counter}"
                opts = []
                for o_idx in range(4):
                    opts.append({
                        'id': chr(97 + o_idx),
                        'text_en': item['options_en'][o_idx] if o_idx < len(item['options_en']) else f"Option {chr(65+o_idx)}",
                        'text_hi': item['options_hi'][o_idx] if o_idx < len(item['options_hi']) else (item['options_en'][o_idx] if o_idx < len(item['options_en']) else f"विकल्प {chr(65+o_idx)}"),
                        'imageUrl': None
                    })
                    
                sdata['questions'][str(q_counter)] = {
                    'id': q_id,
                    'test_id': slug,
                    'question_number': q_counter,
                    'section_name': sec_name,
                    'question_text_en': item['body_en'],
                    'question_text_hi': item['body_hi'],
                    'options': opts,
                    'correct_option_index': item['correct_option_index'],
                    'explanation_en': item['explanation_en'],
                    'explanation_hi': item['explanation_hi'],
                    'has_image': item['has_image']
                }
                q_counter += 1
                
        print(f"Shift '{slug}': {len(sdata['questions'])} total questions configured.", flush=True)
        
    out_path = os.path.join(os.getcwd(), 'src', 'data', 'ssc_selection_post_all_shifts.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(shifts_dict, f, ensure_ascii=False, indent=2)
    print(f"\nSaved accurate Selection Post dataset to: {out_path}", flush=True)
    
    print("\nStarting parallel sync to Supabase `questions` table...", flush=True)
    all_db_rows = []
    for slug, sdata in shifts_dict.items():
        for qnum_str, q in sdata['questions'].items():
            all_db_rows.append({
                'id': q['id'],
                'test_id': q['test_id'],
                'question_number': q['question_number'],
                'section_name': q['section_name'],
                'question_text': q['question_text_en'],
                'question_text_en': q['question_text_en'],
                'question_text_hi': q['question_text_hi'],
                'options': q['options'],
                'correct_option_index': q['correct_option_index'],
                'explanation': q['explanation_en'],
                'explanation_en': q['explanation_en'],
                'explanation_hi': q['explanation_hi'],
                'has_image': q['has_image']
            })
            
    print(f"Total questions to upsert into Supabase: {len(all_db_rows)}")
    
    batch_size = 100
    batches = [all_db_rows[i:i+batch_size] for i in range(0, len(all_db_rows), batch_size)]
    
    def upsert_batch(batch):
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
            print(f"Upsert batch error: {e}", flush=True)
            return 0

    success_count = 0
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = [executor.submit(upsert_batch, b) for b in batches]
        for f in as_completed(futures):
            success_count += f.result()
            
    print(f"\nSupabase sync complete: {success_count}/{len(all_db_rows)} questions updated successfully!", flush=True)

if __name__ == '__main__':
    main()
