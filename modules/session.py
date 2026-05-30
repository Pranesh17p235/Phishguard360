"""
PhishGuard 360 - Module 2: AiTM Session Hijacking Detector
Analyzes session logs for Adversary-in-the-Middle attack indicators
"""

import json
import csv
import io
import math
import requests
from datetime import datetime, timezone
from collections import defaultdict

try:
    from user_agents import parse as ua_parse
    UA_AVAILABLE = True
except Exception:
    UA_AVAILABLE = False


def get_geolocation(ip):
    """Get country/ASN for an IP using ip-api.com (free tier)"""
    try:
        if ip in ("127.0.0.1","localhost") or ip.startswith("10.") or ip.startswith("192.168."):
            return {"country": "LOCAL", "org": "LOCAL", "city": "LOCAL"}
        r = requests.get(f"http://ip-api.com/json/{ip}?fields=country,org,city,status", timeout=5)
        if r.status_code == 200:
            data = r.json()
            if data.get("status") == "success":
                return {"country": data.get("country","Unknown"), 
                        "org": data.get("org","Unknown"),
                        "city": data.get("city","Unknown")}
    except Exception:
        pass
    return {"country": "Unknown", "org": "Unknown", "city": "Unknown"}


def haversine_distance(loc1, loc2):
    """Rough distance check — if countries differ, flag it"""
    return loc1.get("country","") != loc2.get("country","")


def parse_session_log(raw_data, fmt="json"):
    """Parse session log from JSON or CSV"""
    sessions = []
    try:
        if fmt == "json":
            data = json.loads(raw_data)
            if isinstance(data, list):
                sessions = data
            elif isinstance(data, dict):
                sessions = [data]
        elif fmt == "csv":
            reader = csv.DictReader(io.StringIO(raw_data))
            sessions = [row for row in reader]
    except Exception as e:
        return [], str(e)
    return sessions, None


def parse_ts(ts_str):
    """Try to parse various timestamp formats"""
    formats = [
        "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ",
        "%Y-%m-%dT%H:%M:%S.%f"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(str(ts_str).strip(), fmt).replace(tzinfo=timezone.utc)
        except Exception:
            pass
    return None


def analyze_sessions(sessions):
    """
    Run all 5 AiTM detection rules across session log entries.
    Expected fields per entry: session_id, ip, user_agent, timestamp, event_type
    """
    findings = []
    by_session = defaultdict(list)

    for entry in sessions:
        sid = entry.get("session_id") or entry.get("session") or "unknown"
        by_session[sid].append(entry)

    for sid, events in by_session.items():
        events_sorted = sorted(events, key=lambda e: parse_ts(e.get("timestamp","")) or datetime.min.replace(tzinfo=timezone.utc))

        ips = [e.get("ip","") for e in events_sorted if e.get("ip")]
        uas = [e.get("user_agent","") for e in events_sorted if e.get("user_agent")]
        timestamps = [parse_ts(e.get("timestamp","")) for e in events_sorted]
        timestamps = [t for t in timestamps if t]

        # ── Rule 1: Geolocation Jump ──
        if len(ips) >= 2:
            geo_cache = {}
            for ip in set(ips):
                if ip not in geo_cache:
                    geo_cache[ip] = get_geolocation(ip)
            
            for i in range(len(ips)-1):
                geo1 = geo_cache.get(ips[i], {})
                geo2 = geo_cache.get(ips[i+1], {})
                if geo1.get("country") not in ("Unknown","LOCAL") and \
                   geo2.get("country") not in ("Unknown","LOCAL") and \
                   geo1.get("country") != geo2.get("country"):
                    findings.append({
                        "session_id": sid,
                        "rule": "Geolocation Jump",
                        "severity": "HIGH",
                        "detail": f"Session '{sid}' switched from {geo1.get('country')} ({ips[i]}) to {geo2.get('country')} ({ips[i+1]}) without logout.",
                        "explanation": "The same session token was used from two different countries — a strong indicator that an attacker in a different location replayed a stolen session cookie.",
                        "mitre": "T1539 — Steal Web Session Cookie"
                    })

        # ── Rule 2: User-Agent Switch ──
        if len(uas) >= 2:
            unique_uas = list(dict.fromkeys(uas))
            if len(unique_uas) >= 2:
                findings.append({
                    "session_id": sid,
                    "rule": "User-Agent Switch",
                    "severity": "HIGH",
                    "detail": f"Session '{sid}' used {len(unique_uas)} different user agents: {'; '.join(unique_uas[:2])}{'...' if len(unique_uas)>2 else ''}",
                    "explanation": "A real user's browser does not change mid-session. Different user agents on the same session token indicate the token is being used by a different device — likely an attacker.",
                    "mitre": "T1539 — Steal Web Session Cookie"
                })

        # ── Rule 3: Impossible Travel (same session, 2 IPs, short time) ──
        if len(ips) >= 2 and len(timestamps) >= 2:
            unique_ips = list(dict.fromkeys(ips))
            if len(unique_ips) >= 2 and len(timestamps) >= 2:
                time_diff = abs((timestamps[-1] - timestamps[0]).total_seconds())
                if time_diff < 300 and len(unique_ips) >= 2:
                    findings.append({
                        "session_id": sid,
                        "rule": "Impossible Travel",
                        "severity": "HIGH",
                        "detail": f"Session '{sid}' used from {len(unique_ips)} different IPs within {int(time_diff)} seconds.",
                        "explanation": "The same session was used from multiple IP addresses in an impossibly short time — consistent with an attacker immediately replaying a stolen session token.",
                        "mitre": "T1539 — Steal Web Session Cookie"
                    })

        # ── Rule 4: Abnormal Token Refresh Rate ──
        auth_events = [e for e in events_sorted if "auth" in str(e.get("event_type","")).lower() 
                       or "refresh" in str(e.get("event_type","")).lower()
                       or "login" in str(e.get("event_type","")).lower()]
        if len(auth_events) >= 4 and len(timestamps) >= 4:
            intervals = []
            for i in range(1, len(timestamps)):
                intervals.append((timestamps[i]-timestamps[i-1]).total_seconds())
            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                if avg_interval < 30:
                    findings.append({
                        "session_id": sid,
                        "rule": "Abnormal Token Refresh Rate",
                        "severity": "MEDIUM",
                        "detail": f"Session '{sid}' had {len(auth_events)} auth events with avg interval of {avg_interval:.1f}s.",
                        "explanation": "Unusually frequent authentication or token refresh events can indicate automated tooling (like Evilginx2) relaying requests in real time.",
                        "mitre": "T1557 — Adversary-in-the-Middle"
                    })

        # ── Rule 5: Concurrent Sessions from Different IPs ──
        if len(timestamps) >= 2 and len(ips) >= 2:
            unique_ips_list = list(set(ips))
            if len(unique_ips_list) >= 2:
                # Check if different IPs overlap in time
                ip_times = defaultdict(list)
                for e, t in zip(events_sorted, timestamps):
                    ip_times[e.get("ip","")].append(t)
                
                ip_list = [ip for ip in unique_ips_list if ip]
                if len(ip_list) >= 2:
                    t1_range = ip_times.get(ip_list[0], [])
                    t2_range = ip_times.get(ip_list[1], [])
                    if t1_range and t2_range:
                        overlap = (min(t1_range) <= max(t2_range)) and (min(t2_range) <= max(t1_range))
                        if overlap:
                            findings.append({
                                "session_id": sid,
                                "rule": "Concurrent Session from Multiple IPs",
                                "severity": "HIGH",
                                "detail": f"Session '{sid}' was active simultaneously from {ip_list[0]} and {ip_list[1]}.",
                                "explanation": "Two different IP addresses were using the same session token at the same time — one is the legitimate user, the other is likely an attacker who stole the session cookie.",
                                "mitre": "T1539 — Steal Web Session Cookie"
                            })

    severity_weights = {"HIGH": 30, "MEDIUM": 15, "LOW": 5}
    score = min(100, sum(severity_weights.get(f["severity"],0) for f in findings))
    verdict = "ATTACK DETECTED" if score >= 70 else ("SUSPICIOUS" if score >= 31 else "CLEAN")
    verdict_class = "danger" if score >= 70 else ("warning" if score >= 31 else "success")

    sessions_analyzed = len(by_session)
    return {
        "score": score,
        "verdict": verdict,
        "verdict_class": verdict_class,
        "findings": findings,
        "sessions_analyzed": sessions_analyzed,
        "finding_count": len(findings),
        "high_count": sum(1 for f in findings if f["severity"]=="HIGH"),
        "medium_count": sum(1 for f in findings if f["severity"]=="MEDIUM"),
    }


# ── Sample log generator for demo ──
SAMPLE_LOG = json.dumps([
    {"session_id":"sess_001","ip":"98.23.45.67","user_agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0","timestamp":"2024-03-15T09:00:00Z","event_type":"login"},
    {"session_id":"sess_001","ip":"91.108.56.23","user_agent":"python-requests/2.28.0","timestamp":"2024-03-15T09:00:45Z","event_type":"page_view"},
    {"session_id":"sess_001","ip":"91.108.56.23","user_agent":"python-requests/2.28.0","timestamp":"2024-03-15T09:01:10Z","event_type":"auth_refresh"},
    {"session_id":"sess_002","ip":"72.14.192.1","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/537.36","timestamp":"2024-03-15T10:00:00Z","event_type":"login"},
    {"session_id":"sess_002","ip":"72.14.192.1","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/537.36","timestamp":"2024-03-15T10:05:00Z","event_type":"page_view"},
    {"session_id":"sess_003","ip":"192.168.1.10","user_agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/119.0","timestamp":"2024-03-15T11:00:00Z","event_type":"login"},
    {"session_id":"sess_003","ip":"192.168.1.10","user_agent":"Mozilla/5.0 (Windows NT 10.0) Chrome/119.0","timestamp":"2024-03-15T11:30:00Z","event_type":"page_view"},
], indent=2)
