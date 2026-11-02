import sys, os, re, json, time
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber
from supabase import create_client, Client

SUPABASE_URL = 'https://gstoqyvnwpvhciidmigt.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzdG9xeXZud3B2aGNpaWRtaWd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzM1MjI3NSwiZXhwIjoyMTA4OTI4Mjc1fQ.bCifhuGwIpAMGtovutlNT6Fk6Ftuh-amZS35b7svtGA'

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

PDF_CONFIGS = [
    {
        'subject': 'Reasoning',
        'section_name': 'General Intelligence & Reasoning',
        'q_offset': 1,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE ENGLISH (1).pdf"
    },
    {
        'subject': 'GK',
        'section_name': 'General Awareness',
        'q_offset': 26,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST PHASE 14 GK CHAPTERWISE-ENGLISH.pdf"
    },
    {
        'subject': 'Math',
        'section_name': 'Quantitative Aptitude',
        'q_offset': 51,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\SELECTION POST 14 MATH CHAPTER WISE ENGLISH.pdf"
    },
    {
        'subject': 'English',
        'section_name': 'English Comprehension',
        'q_offset': 76,
        'path': r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 ENGLISH LANGUAGE CHAPTER WISE.pdf"
    }
]

def normalize_shift_key(level_raw, date_raw, shift_raw):
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
    return (lines + ["Option A", "Option B", "Option C", "Option D"])[:4]

def is_diagram_question(text):
    t = text.lower()
    triggers = [
        "figure", "image", "mirror image", "water image", "paper folded", "folded and cut",
        "embedded in the given", "venn diagram", "select the figure", "pattern in the figure",
        "following figure", "given figure", "triangle in the given", "square in the given"
    ]
    return any(trig in t for trig in triggers)

print("Ingestion script setup ready.", flush=True)
