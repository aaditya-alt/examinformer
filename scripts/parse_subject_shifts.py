import sys, os, re, json
sys.stdout.reconfigure(encoding='utf-8')
import pdfplumber

def parse_pdf(path, subject_name):
    print(f"=== Parsing {subject_name} ({os.path.basename(path)}) ===", flush=True)
    all_pages_text = []
    with pdfplumber.open(path) as pdf:
        total_p = len(pdf.pages)
        print(f"Total pages: {total_p}", flush=True)
        for idx in range(total_p):
            p = pdf.pages[idx]
            w = p.width
            h = p.height
            left = p.crop((0, 0, w / 2, h)).extract_text(layout=False) or ""
            right = p.crop((w / 2, 0, w, h)).extract_text(layout=False) or ""
            all_pages_text.append(f"\n[PAGE_{idx+1}_LEFT]\n" + left)
            all_pages_text.append(f"\n[PAGE_{idx+1}_RIGHT]\n" + right)
            if (idx + 1) % 40 == 0 or idx + 1 == total_p:
                print(f"Extracted {idx+1}/{total_p} pages...", flush=True)
                
    full_text = "\n".join(all_pages_text)
    
    # Extract all shift tagged questions
    # Shift regex: Selection Post (Graduate|12th|10th) <date> Shift <shift>
    shift_pattern = re.compile(
        r"Selection\s+Post\s+\((Graduate|12th|10th)\)\s+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\s+Shift\s+(\d+)",
        re.IGNORECASE
    )
    
    # Split by questions: "Q.1", "Q.2", etc.
    q_matches = list(re.finditer(r"(?:^|\n)Q\.(\d+)\s*", full_text))
    print(f"Found {len(q_matches)} question headers in {subject_name}", flush=True)
    
    shifts_map = {}
    
    for i in range(len(q_matches)):
        start = q_matches[i].start()
        end = q_matches[i+1].start() if i + 1 < len(q_matches) else len(full_text)
        chunk = full_text[start:end]
        
        # Check if this is an explanation block or question block
        if "Right option (" in chunk or "✔ Answer:" in chunk:
            continue
            
        m = shift_pattern.search(chunk)
        if m:
            level = m.group(1).title()
            date = m.group(2).title()
            shift_num = m.group(3)[0] # first digit
            shift_key = f"{level} | {date} | Shift {shift_num}"
            if shift_key not in shifts_map:
                shifts_map[shift_key] = []
            shifts_map[shift_key].append(chunk[:120].replace('\n', ' '))
            
    print(f"\nFound questions across {len(shifts_map)} unique shifts in {subject_name}:", flush=True)
    for s, qs in sorted(shifts_map.items()):
        print(f"  {s}: {len(qs)} questions", flush=True)
        
    return shifts_map

if __name__ == '__main__':
    r_path = r"C:\Users\Aaditya Ranjan\Downloads\Telegram Desktop\PHASE 14 REASONING CHAPTER WISE ENGLISH (1).pdf"
    parse_pdf(r_path, "Reasoning")
