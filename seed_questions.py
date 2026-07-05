#!/usr/bin/env python3
import subprocess, json, re, sys

API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoeHljcXZzc2l6ZXFnYmJzZ210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MzI1MjIsImV4cCI6MjA5MzEwODUyMn0.-UlBwG0Rf72bQFyzbba6YeZJXc7wIg52wCE1-7GM5x0"
URL = "https://fhxycqvssizeqgbbsgmt.supabase.co/rest/v1/questions"
LETTER = {0: "A", 1: "B", 2: "C"}

def db_questions():
    r = subprocess.run(["curl", "-s", URL, "-H", f"apikey: {API_KEY}", "-H", "accept: application/json"],
                      capture_output=True, text=True)
    return json.loads(r.stdout)

def parse_ts(path):
    text = open(path).read()
    found = re.search(r"quizBank\s*:\s*QuizQuestion\[\]\s*=\s*\[(.+?)\n\];", text, re.DOTALL)
    if not found:
        return []
    # Split on } to get individual objects
    objects = []
    block = found.group(1)
    # Split by "}, {" pattern
    pieces = re.split(r"\},\s*\{", block)
    for i, piece in enumerate(pieces):
        piece = piece.strip()
        if not piece or piece.startswith("//"):
            continue
        # Clean braces
        piece = piece.strip("{").strip("}").strip(",").strip()
        piece = "{" + piece + "}"
        try:
            # Extract fields with simple string searches
            id_m   = re.search(r'id:\s*(\d+)', piece)
            top_m  = re.search(r'topic:\s*"([^"]+)"', piece)
            q_m    = re.search(r'question:\s*"([^"]+)"', piece)
            opt_m  = re.search(r'options:\s*\[(.*?)\]', piece, re.DOTALL)
            cor_m  = re.search(r'correctIndex:\s*(\d)', piece)
            exp_m  = re.search(r'explanation:\s*"([^"]+)"', piece)
            if not all([id_m, top_m, q_m, opt_m, cor_m, exp_m]):
                continue
            opts = [o.strip().strip('",').strip() for o in re.findall(r'"[^"]*"', opt_m.group(1))]
            objects.append({
                "id": int(id_m.group(1)),
                "topic": top_m.group(1),
                "question": q_m.group(1),
                "options": opts,
                "correct_letter": LETTER.get(int(cor_m.group(1)), "A"),
                "explanation": exp_m.group(1),
            })
        except Exception:
            continue
    return objects

def insert_batch(items):
    if not items:
        print("Nothing to insert.")
        return
    payload = []
    for q in items:
        payload.append({
            "topic_slug": q["topic"],
            "question": q["question"],
            "option_a": q["options"][0] if len(q["options"]) > 0 else "",
            "option_b": q["options"][1] if len(q["options"]) > 1 else "",
            "option_c": q["options"][2] if len(q["options"]) > 2 else "",
            "correct_option": q["correct_letter"],
            "explanation": q["explanation"],
            "is_active": True,
            "min_age": 6,
            "max_age": 99,
            "target_gender": "all",
        })
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    r = subprocess.run(
        ["curl", "-s", "-X", "POST", URL,
         "-H", f"apikey: {API_KEY}",
         "-H", f"Authorization: Bearer {API_KEY}",
         "-H", "Content-Type: application/json",
         "-H", "Prefer: resolution=minimal",
         "-d", "@-"],
        input=data, capture_output=True, text=True
    )
    return r.stdout, r.returncode

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "src/data/quizQuestions.ts"

    print("Fetching DB questions...")
    db_qs = db_questions()
    db_set = {q["question"] for q in db_qs}
    print(f"  DB has {len(db_qs)} questions")

    print(f"Parsing {src}...")
    ts_qs = parse_ts(src)
    print(f"  TS source has {len(ts_qs)} questions")

    missing = [q for q in ts_qs if q["question"] not in db_set]
    print(f"\nMissing: {len(missing)}")

    from collections import Counter
    for topic, cnt in sorted(Counter(q["topic"] for q in missing).items()):
        print(f"  {topic}: {cnt}")

    if not missing:
        print("DB is in sync with source.")
        return

    print(f"\nInserting {len(missing)} questions...")
    out, code = insert_batch(missing)
    if code == 0:
        print(f"  Response: {out.strip() or 'empty (success)'}")
    else:
        print(f"  Error: {out}")

    print("\nFinal DB count...")
    db_after = db_questions()
    print(f"  Total: {len(db_after)}")
    for topic, cnt in sorted(Counter(q["topic_slug"] for q in db_after).items()):
        print(f"  {topic}: {cnt}")

if __name__ == "__main__":
    main()
