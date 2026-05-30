"""
PhishGuard 360 - Module 3: Human Susceptibility Dashboard
Analyzes GoPhish campaign CSV data for behavioral segmentation
"""

import csv
import io
import json
from collections import defaultdict
from datetime import datetime


SAMPLE_CSV = """FirstName,LastName,Email,Department,Position,EmailSent,EmailOpened,ClickedLink,SubmittedData,Campaign
Alice,Johnson,alice@corp.com,Finance,Analyst,2024-03-01 08:00:00,2024-03-01 08:05:00,2024-03-01 08:07:00,,Q1 Phish Test
Bob,Smith,bob@corp.com,Engineering,Developer,2024-03-01 08:00:00,,,, Q1 Phish Test
Carol,Lee,carol@corp.com,HR,Manager,2024-03-01 08:00:00,2024-03-01 09:00:00,2024-03-01 09:02:00,2024-03-01 09:03:00,Q1 Phish Test
Dave,Brown,dave@corp.com,Finance,Manager,2024-03-01 08:00:00,2024-03-01 08:30:00,2024-03-01 08:31:00,,Q1 Phish Test
Eve,Davis,eve@corp.com,Engineering,Lead,2024-03-01 08:00:00,,,, Q1 Phish Test
Frank,Wilson,frank@corp.com,HR,Recruiter,2024-03-01 08:00:00,2024-03-01 10:00:00,2024-03-01 10:05:00,2024-03-01 10:06:00,Q1 Phish Test
Grace,Moore,grace@corp.com,Finance,Analyst,2024-03-01 08:00:00,2024-03-01 08:10:00,,,Q1 Phish Test
Henry,Taylor,henry@corp.com,IT,Admin,2024-03-01 08:00:00,,,,Q1 Phish Test
Iris,Anderson,iris@corp.com,HR,Coordinator,2024-03-01 08:00:00,2024-03-01 11:00:00,2024-03-01 11:01:00,,Q1 Phish Test
Jack,Thomas,jack@corp.com,Engineering,Developer,2024-03-01 08:00:00,,,, Q1 Phish Test
Karen,Jackson,karen@corp.com,Finance,Director,2024-03-01 08:00:00,2024-03-01 08:02:00,2024-03-01 08:03:00,2024-03-01 08:04:00,Q1 Phish Test
Leo,White,leo@corp.com,IT,Engineer,2024-03-01 08:00:00,,,, Q1 Phish Test
Maria,Harris,maria@corp.com,HR,Manager,2024-03-01 08:00:00,2024-03-01 09:30:00,2024-03-01 09:32:00,,Q1 Phish Test
Nick,Martin,nick@corp.com,Finance,Analyst,2024-03-01 08:00:00,2024-03-01 08:45:00,,,Q1 Phish Test
Olivia,Garcia,olivia@corp.com,Engineering,Architect,2024-03-01 08:00:00,,,, Q1 Phish Test
"""


def parse_dt(s):
    if not s or not str(s).strip():
        return None
    for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S"]:
        try:
            return datetime.strptime(str(s).strip(), fmt)
        except Exception:
            pass
    return None


def parse_csv(raw_csv):
    try:
        reader = csv.DictReader(io.StringIO(raw_csv.strip()))
        rows = [row for row in reader]
        # Normalize keys
        normalized = []
        for row in rows:
            norm = {k.strip().lower().replace(" ",""): v.strip() for k, v in row.items()}
            normalized.append(norm)
        return normalized, None
    except Exception as e:
        return [], str(e)


def key(row, *names):
    for n in names:
        v = row.get(n.lower().replace(" ",""), "")
        if v:
            return v
    return ""


def analyze_campaign(rows):
    if not rows:
        return None

    total = len(rows)
    clicked = [r for r in rows if key(r,"clickedlink","clicked")]
    submitted = [r for r in rows if key(r,"submitteddata","submitted")]
    opened = [r for r in rows if key(r,"emailopened","opened")]

    overall_open_rate   = round(len(opened)   / total * 100, 1) if total else 0
    overall_click_rate  = round(len(clicked)  / total * 100, 1) if total else 0
    overall_submit_rate = round(len(submitted) / total * 100, 1) if total else 0

    # ── By Department ──
    dept_stats = defaultdict(lambda: {"total":0,"clicked":0,"submitted":0})
    for r in rows:
        dept = key(r,"department","dept") or "Unknown"
        dept_stats[dept]["total"] += 1
        if key(r,"clickedlink","clicked"):
            dept_stats[dept]["clicked"] += 1
        if key(r,"submitteddata","submitted"):
            dept_stats[dept]["submitted"] += 1
    dept_data = []
    for dept, s in dept_stats.items():
        dept_data.append({
            "label": dept,
            "click_rate": round(s["clicked"]/s["total"]*100,1) if s["total"] else 0,
            "submit_rate": round(s["submitted"]/s["total"]*100,1) if s["total"] else 0,
            "total": s["total"],
            "clicked": s["clicked"],
            "submitted": s["submitted"],
        })
    dept_data.sort(key=lambda x: x["click_rate"], reverse=True)

    # ── By Role/Position ──
    role_stats = defaultdict(lambda: {"total":0,"clicked":0,"submitted":0})
    for r in rows:
        role = key(r,"position","role","title") or "Unknown"
        role_stats[role]["total"] += 1
        if key(r,"clickedlink","clicked"):
            role_stats[role]["clicked"] += 1
        if key(r,"submitteddata","submitted"):
            role_stats[role]["submitted"] += 1
    role_data = []
    for role, s in role_stats.items():
        role_data.append({
            "label": role,
            "click_rate": round(s["clicked"]/s["total"]*100,1) if s["total"] else 0,
            "submit_rate": round(s["submitted"]/s["total"]*100,1) if s["total"] else 0,
            "total": s["total"],
        })
    role_data.sort(key=lambda x: x["click_rate"], reverse=True)

    # ── By Hour of Day ──
    hour_clicks = defaultdict(int)
    hour_total  = defaultdict(int)
    for r in rows:
        sent_str = key(r,"emailsent","sent")
        sent_dt  = parse_dt(sent_str)
        if sent_dt:
            hour_total[sent_dt.hour] += 1
        click_str = key(r,"clickedlink","clicked")
        click_dt  = parse_dt(click_str)
        if click_dt:
            hour_clicks[click_dt.hour] += 1
    hour_data = [{"hour": f"{h:02d}:00", "clicks": hour_clicks.get(h,0)} for h in range(24)]

    # ── Time to Click ──
    ttc_values = []
    for r in rows:
        sent  = parse_dt(key(r,"emailsent","sent"))
        click = parse_dt(key(r,"clickedlink","clicked"))
        if sent and click:
            diff = (click - sent).total_seconds() / 60
            if 0 <= diff <= 1440:
                ttc_values.append(round(diff, 1))
    avg_ttc = round(sum(ttc_values)/len(ttc_values),1) if ttc_values else None

    # ── Top risk segments ──
    risk_segments = []
    for d in dept_data[:3]:
        if d["click_rate"] > 0:
            training = get_training_rec(d["label"], d["click_rate"])
            risk_segments.append({
                "segment": f"{d['label']} Department",
                "click_rate": d["click_rate"],
                "risk_level": "HIGH" if d["click_rate"] >= 50 else "MEDIUM",
                "training": training
            })

    return {
        "total": total,
        "overall_open_rate": overall_open_rate,
        "overall_click_rate": overall_click_rate,
        "overall_submit_rate": overall_submit_rate,
        "dept_data": dept_data,
        "role_data": role_data,
        "hour_data": hour_data,
        "avg_ttc": avg_ttc,
        "ttc_values": ttc_values,
        "risk_segments": risk_segments,
        "clicked_count": len(clicked),
        "submitted_count": len(submitted),
        "opened_count": len(opened),
    }


def get_training_rec(segment, click_rate):
    recs = {
        "Finance": "Focus on invoice fraud, wire transfer scams, and vendor impersonation. Finance teams are the primary target of BEC attacks.",
        "HR": "Train on fake job application phishing, payroll redirect scams, and employee data harvesting emails.",
        "Engineering": "Focus on code repository phishing, fake security alerts from GitHub/Jira, and supply chain attack awareness.",
        "IT": "Reinforce that IT staff are high-value targets. Train on help desk impersonation and credential reset phishing.",
        "Executive": "Focus on whale phishing, CEO fraud, and M&A-themed spear phishing. Brief, high-impact training formats work best.",
    }
    for k, v in recs.items():
        if k.lower() in segment.lower():
            return v
    if click_rate >= 60:
        return f"High-risk group ({click_rate}% click rate). Recommend immediate targeted phishing awareness training with simulated follow-up campaign within 2 weeks."
    return f"Click rate of {click_rate}% is above acceptable threshold. Schedule role-specific phishing awareness training and re-test within 30 days."
