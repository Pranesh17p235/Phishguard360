# PhishGuard 360

> **CSEC 594 — Security Capstone | DePaul University | Spring 2026**

A multi-channel phishing defense framework that addresses the three critical gaps every existing phishing tool ignores: modern non-email attack channels, post-MFA session hijacking, and unmeasured human behavioral vulnerability.

---

## The Problem

Current phishing tools rely on static email scanning and generic templates. They lack the ability to secure modern communication channels, stop context-based session hijacking, and measure actual human behavior — leaving organizations highly vulnerable to advanced social engineering.

---

## Modules

### Module 1 — Multi-Channel Phishing Scanner
Analyzes phishing threats across **Email, Slack, Teams, SMS, and QR codes** through a single unified detection engine.
- Header integrity analysis (SPF / DKIM / DMARC)
- Lookalike domain detection (Levenshtein scoring)
- URL reputation & domain age analysis
- NLP-based urgency and manipulation scoring
- QR code decoding and hidden URL analysis
- Government impersonation & smishing detection

### Module 2 — AiTM Session Hijacking Detector
Detects Adversary-in-the-Middle attack indicators that **survive MFA** — the post-authentication attack surface every tool ignores.
- Geolocation jump detection
- User-agent switching
- Impossible travel analysis
- Concurrent session from multiple IPs
- Abnormal token refresh rate

### Module 3 — Human Susceptibility Dashboard
Transforms GoPhish campaign data into **behavioral intelligence**.
- Click rate by department and role
- Time-of-day heat map
- Time-to-click analysis
- Targeted training recommendations per risk segment

### Module 4 — Scan History
Full audit trail of every scan with **select-and-delete** functionality.
- All scans auto-saved with timestamp and verdict
- Expandable findings per entry
- Bulk select and delete
- Persists across app restarts

---

## Installation

### Prerequisites
- Python 3.10+
- pip

### macOS — QR code support (optional)
```bash
brew install zbar
```

### Install dependencies
```bash
pip install -r requirements.txt
```

### Run
```bash
python app.py
```

Open your browser at: **http://127.0.0.1:5000**

---

## Optional — VirusTotal API (URL reputation)
For enhanced URL reputation checking, set your free VirusTotal API key:
```bash
export VT_API_KEY=your_api_key_here
python app.py
```
Get a free key at https://www.virustotal.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask |
| Frontend | Bootstrap 5, Chart.js |
| Font | Orbitron, Share Tech Mono |
| QR Decoding | pyzbar / OpenCV fallback |
| URL Analysis | tldextract, python-whois, VirusTotal API |
| NLP | NLTK keyword scoring, regex pattern matching |
| Data | pandas |

---

## Project Structure

```
phishguard360/
├── app.py                      # Flask routes
├── requirements.txt
├── modules/
│   ├── scanner.py              # Module 1: multi-channel scanner
│   ├── session.py              # Module 2: AiTM detector
│   ├── susceptibility.py       # Module 3: susceptibility dashboard
│   ├── history.py              # Module 4: scan history
│   └── qr_decoder.py          # QR decoding with fallbacks
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── scanner.html
│   ├── session.html
│   ├── susceptibility.html
│   └── history.html
└── static/
    └── style.css               # Hacker terminal theme
```

---

## Sample Test Data

The app includes built-in sample data for all three modules:
- **Scanner** — paste any suspicious email, SMS, or Slack message
- **Session Detector** — click "Use Sample Log" to see AiTM anomalies detected
- **Susceptibility** — click "Use Sample Data" to see GoPhish analytics

---

## What Makes This Different

| Feature | PhishGuard 360 | Existing Tools |
|---|---|---|
| Multi-channel (Slack/SMS/QR) | ✅ | ❌ Email only |
| Zero-day phishing detection | ✅ Structural analysis | ❌ Reputation DB only |
| Post-MFA session hijacking | ✅ AiTM detection | ❌ Not covered |
| Human behavior analytics | ✅ Role-segmented | ❌ Generic reports |
| 100% local / no cloud | ✅ | ❌ Cloud-dependent |
| Free & open source | ✅ | ❌ Enterprise pricing |

---

## Author

**CSEC594_S26_Student5**
DePaul University — College of Computing and Digital Media
Instructor: Dr. Filipo Sharevski

---

## Disclaimer

This tool is developed for educational purposes as part of a university capstone project. All test data used is synthetic. Do not use against systems you do not own or have explicit permission to test.
