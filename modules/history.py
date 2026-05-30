"""
PhishGuard 360 - Scan History Manager
"""
import json, os
from datetime import datetime

HISTORY_FILE = os.path.join(os.path.dirname(__file__), "..", "scan_history.json")

def load_history():
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(entries):
    try:
        with open(HISTORY_FILE, "w") as f:
            json.dump(entries, f, indent=2)
        return True
    except Exception:
        return False

def add_entry(channel, verdict, score, finding_count, high_count, medium_count, low_count, findings, input_preview):
    entries = load_history()
    entry_id = str(int(datetime.now().timestamp() * 1000))
    entry = {
        "id": entry_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "channel": channel,
        "verdict": verdict,
        "score": score,
        "finding_count": finding_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "findings": findings,
        "input_preview": input_preview[:200] if input_preview else "",
    }
    entries.insert(0, entry)
    entries = entries[:100]
    save_history(entries)
    return entry_id

def delete_entries(entry_ids):
    entries = load_history()
    entries = [e for e in entries if e.get("id") not in entry_ids]
    return save_history(entries)

def clear_all():
    return save_history([])
