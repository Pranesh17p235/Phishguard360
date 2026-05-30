"""
PhishGuard 360 - Module 1: Multi-Channel Phishing Scanner
Analyzes email (.eml), Slack/Teams messages, SMS text, and QR code images
"""

import re
import email
import json
import math
import requests
import tldextract
from datetime import datetime, timezone
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

try:
    from pyzbar.pyzbar import decode as qr_decode
    PYZBAR_AVAILABLE = True
except Exception:
    PYZBAR_AVAILABLE = False

try:
    import whois
    WHOIS_AVAILABLE = True
except Exception:
    WHOIS_AVAILABLE = False

# ── Top brand domains for lookalike detection ──
TOP_BRANDS = [
    "paypal.com","apple.com","microsoft.com","google.com","amazon.com",
    "facebook.com","instagram.com","twitter.com","linkedin.com","netflix.com",
    "bankofamerica.com","chase.com","wellsfargo.com","citibank.com",
    "irs.gov","usps.com","fedex.com","ups.com","dhl.com","dropbox.com",
    "outlook.com","gmail.com","yahoo.com","icloud.com","docusign.com",
    "zoom.us","slack.com","office365.com","sharepoint.com","onedrive.com",
    "illinois.gov","dot.illinois.gov","idot.illinois.gov","e-zpass.com","ipass.com",
]

URGENCY_KEYWORDS = [
    # Classic phishing
    "urgent","immediately","account suspended","verify your account","confirm your identity",
    "unusual activity","limited time","act now","your account will be","click here to",
    "update your information","security alert","unauthorized access","password expired",
    "invoice attached","you have won","claim your prize","wire transfer","kindly",
    "dear customer","dear user","validate","reactivate","locked","compromised",
    # Government / fine / toll smishing
    "outstanding","traffic ticket","violation","suspension","driver's license",
    "vehicle registration","dmv","toll","fine","penalty","legal proceedings",
    "credit damage","enforcement","pay promptly","failure to pay","processing charge",
    "administrative code","referral","collection service","license suspension",
    "pay now","overdue","past due","unpaid","notice of","department of",
    # SMS smishing patterns
    "reply y","reopen this message","paste it into your browser",
    "resolve payment","avoid suspension","avoid legal","your package",
    "delivery address","confirm delivery",
    "bank account","banking alert","transaction declined","verify now",
]

# Government agencies commonly impersonated
GOV_IMPERSONATION = [
    "illinois dot","idot","dmv","irs","usps","social security","medicare",
    "fbi","ssa","department of transportation","state police","toll authority",
    "e-zpass","ipass","comptroller","revenue department","secretary of state",
    "dot","fcc","ftc","cdc","fda",
]

# Suspicious TLDs common in phishing
SUSPICIOUS_TLDS = [
    ".ru", ".cn", ".tk", ".ml", ".ga", ".cf", ".gq", ".top", ".xyz",
    ".pw", ".cc", ".click", ".link", ".online", ".site", ".web",
]

# Suspicious keywords inside domain names
SUSPICIOUS_DOMAIN_KEYWORDS = [
    "fine", "pay", "ticket", "toll", "violation", "dmv", "gov-",
    "verify", "secure", "update", "alert", "login", "account",
    "confirm", "support", "billing", "invoice", "payment", "refund",
    "suspended", "renewal", "ilwt", "il-", "-il", "idot",
]

SUSPICIOUS_EXTENSIONS = [
    ".exe",".js",".vbs",".bat",".cmd",".scr",".ps1",".docm",".xlsm",".zip",".rar"
]


def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            curr.append(min(prev[j+1]+1, curr[j]+1, prev[j]+(0 if c1==c2 else 1)))
        prev = curr
    return prev[-1]


def extract_urls(text):
    pattern = r'https?://[^\s\'"<>\)]+'
    return list(set(re.findall(pattern, text)))


def check_lookalike(domain):
    findings = []
    ext = tldextract.extract(domain)
    registered = f"{ext.domain}.{ext.suffix}" if ext.suffix else ext.domain
    for brand in TOP_BRANDS:
        brand_ext = tldextract.extract(brand)
        brand_reg = f"{brand_ext.domain}.{brand_ext.suffix}"
        dist = levenshtein(registered.lower(), brand_reg.lower())
        if 0 < dist <= 2 and registered.lower() != brand_reg.lower():
            findings.append({
                "type": "Lookalike Domain",
                "severity": "HIGH",
                "detail": f"'{registered}' closely resembles '{brand_reg}' (edit distance: {dist})",
                "explanation": f"This domain looks almost identical to {brand_reg} — a common trick attackers use to fool users who don't read URLs carefully."
            })
    return findings


def check_suspicious_domain(domain, url):
    """Check for suspicious keywords in domain name and suspicious TLDs"""
    findings = []
    ext = tldextract.extract(domain)
    domain_lower = domain.lower()
    subdomain = ext.subdomain.lower() if ext.subdomain else ""
    tld = f".{ext.suffix}" if ext.suffix else ""

    # Suspicious TLD
    for stld in SUSPICIOUS_TLDS:
        if tld == stld:
            findings.append({
                "type": "Suspicious TLD",
                "severity": "HIGH",
                "detail": f"Domain '{domain}' uses the TLD '{stld}', commonly associated with phishing and spam.",
                "explanation": f"The '{stld}' top-level domain is frequently used by attackers because it is cheap or free to register. Legitimate government and business websites rarely use this TLD."
            })

    # Suspicious keywords inside the domain
    matched_kws = [kw for kw in SUSPICIOUS_DOMAIN_KEYWORDS if kw in domain_lower]
    if matched_kws:
        findings.append({
            "type": "Suspicious Domain Keywords",
            "severity": "HIGH",
            "detail": f"Domain '{domain}' contains suspicious keyword(s): {', '.join(matched_kws)}",
            "explanation": "Attackers register domains containing words like 'fine', 'pay', 'toll', or agency names to impersonate government or payment sites. Legitimate agencies use official .gov domains."
        })

    # Government impersonation — domain claims to be gov but isn't .gov
    gov_keywords = ["dot","dmv","irs","idot","usps","toll","gov","state","dept","department"]
    has_gov_kw = any(kw in domain_lower for kw in gov_keywords)
    if has_gov_kw and not domain_lower.endswith(".gov"):
        findings.append({
            "type": "Government Impersonation",
            "severity": "HIGH",
            "detail": f"Domain '{domain}' uses government-sounding keywords but is NOT a .gov domain.",
            "explanation": "All legitimate US government websites use .gov domains. A site claiming to be a government agency on any other domain (like .com, .net, or others) is almost certainly fraudulent."
        })

    return findings


def check_domain_age(domain):
    if not WHOIS_AVAILABLE:
        return []
    try:
        ext = tldextract.extract(domain)
        registered = f"{ext.domain}.{ext.suffix}"
        w = whois.whois(registered)
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if creation:
            if creation.tzinfo is None:
                creation = creation.replace(tzinfo=timezone.utc)
            age_days = (datetime.now(timezone.utc) - creation).days
            if age_days < 30:
                return [{
                    "type": "Newly Registered Domain",
                    "severity": "HIGH",
                    "detail": f"'{registered}' was registered {age_days} days ago.",
                    "explanation": f"Phishing domains are often registered days before an attack. This domain is only {age_days} days old — a strong warning sign."
                }]
            elif age_days < 180:
                return [{
                    "type": "Recently Registered Domain",
                    "severity": "MEDIUM",
                    "detail": f"'{registered}' was registered {age_days} days ago.",
                    "explanation": f"This domain is relatively new ({age_days} days old), which can indicate it was created recently for malicious purposes."
                }]
    except Exception:
        pass
    return []


def check_url_structure(url):
    findings = []
    if re.match(r'https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
        findings.append({
            "type": "IP-Based URL",
            "severity": "HIGH",
            "detail": "URL uses a raw IP address instead of a domain name.",
            "explanation": "Legitimate websites use domain names, not raw IP addresses. URLs pointing directly to an IP are almost always suspicious."
        })
    shorteners = ["bit.ly","tinyurl.com","t.co","ow.ly","goo.gl","rb.gy","short.io","cutt.ly"]
    ext = tldextract.extract(url)
    if f"{ext.domain}.{ext.suffix}" in shorteners:
        findings.append({
            "type": "URL Shortener",
            "severity": "MEDIUM",
            "detail": "URL uses a shortening service that hides the real destination.",
            "explanation": "Attackers use URL shorteners to hide malicious links. The real destination is unknown until clicked."
        })
    if url.count("//") > 1:
        findings.append({
            "type": "Double Slash Redirect",
            "severity": "MEDIUM",
            "detail": "URL contains multiple slashes suggesting a redirect trick.",
            "explanation": "Attackers embed real domain names inside fake URLs — e.g., evil.com//paypal.com/login."
        })
    return findings


def check_virustotal(url, api_key):
    if not api_key:
        return []
    try:
        import base64
        headers = {"x-apikey": api_key}
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
        r = requests.get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers, timeout=8)
        if r.status_code == 200:
            data = r.json()
            stats = data.get("data",{}).get("attributes",{}).get("last_analysis_stats",{})
            malicious = stats.get("malicious", 0)
            if malicious > 0:
                return [{
                    "type": "VirusTotal Detection",
                    "severity": "HIGH",
                    "detail": f"{malicious} security vendors flagged this URL as malicious.",
                    "explanation": f"This URL was reported as malicious by {malicious} security vendors."
                }]
    except Exception:
        pass
    return []


def check_gov_impersonation_text(text):
    """Detect government agency impersonation in message body"""
    findings = []
    text_lower = text.lower()
    matched = [agency for agency in GOV_IMPERSONATION if agency in text_lower]
    if matched:
        findings.append({
            "type": "Government Agency Impersonation",
            "severity": "HIGH",
            "detail": f"Message impersonates government agency: {', '.join(matched)}",
            "explanation": "This message claims to be from a government agency. Legitimate agencies contact you via official mail or official .gov websites — never via SMS with payment links."
        })
    return findings


def check_smishing_patterns(text):
    """SMS-specific phishing pattern detection"""
    findings = []
    text_lower = text.lower()

    # Legal threat pattern
    legal_threats = ["legal proceedings","credit damage","court","attorney","lawsuit","prosecution"]
    matched_legal = [t for t in legal_threats if t in text_lower]
    if matched_legal:
        findings.append({
            "type": "Legal Threat Pattern",
            "severity": "HIGH",
            "detail": f"Message uses legal threats: {', '.join(matched_legal)}",
            "explanation": "Scammers use fake legal threats to create fear and urgency. Government agencies do not issue legal threats via SMS with payment links."
        })

    # Penalty/fine payment demand
    payment_patterns = ["pay promptly","pay now","outstanding","failure to pay","processing charge","penalty","fine"]
    matched_pay = [p for p in payment_patterns if p in text_lower]
    if len(matched_pay) >= 2:
        findings.append({
            "type": "SMS Payment Scam Pattern",
            "severity": "HIGH",
            "detail": f"Message demands urgent payment with penalty threats: {', '.join(matched_pay[:4])}",
            "explanation": "This matches a known SMS smishing pattern where attackers impersonate government agencies to collect fake fines or tolls. Real agencies send official paper notices, not SMS links."
        })

    # Fake instruction pattern (reply Y, paste link)
    if "reply y" in text_lower or "reopen this message" in text_lower or "paste it into" in text_lower:
        findings.append({
            "type": "Suspicious SMS Instruction",
            "severity": "HIGH",
            "detail": "Message instructs user to 'Reply Y', reopen the message, or paste a link manually.",
            "explanation": "This is a classic smishing evasion technique — instructing users to interact in ways that bypass link-click detection on mobile devices."
        })

    # Specific law/code citation (fake authority)
    if re.search(r'(section|code|statute|chapter)\s+[\d\w\-\.]+', text_lower):
        findings.append({
            "type": "Fake Legal Citation",
            "severity": "MEDIUM",
            "detail": "Message cites a specific legal code or statute to appear official.",
            "explanation": "Scammers cite fake or real legal codes to appear authoritative. Legitimate government notices arrive by certified mail, not SMS."
        })

    return findings


def score_urgency(text):
    findings = []
    text_lower = text.lower()
    matched = [kw for kw in URGENCY_KEYWORDS if kw in text_lower]
    if len(matched) >= 4:
        findings.append({
            "type": "High Urgency / Manipulation Language",
            "severity": "HIGH",
            "detail": f"Found {len(matched)} urgency/manipulation phrases: {', '.join(matched[:6])}{'...' if len(matched)>6 else ''}",
            "explanation": "This message uses multiple pressure tactics designed to make you act without thinking — a hallmark of phishing and smishing attacks."
        })
    elif len(matched) >= 2:
        findings.append({
            "type": "Urgency Language Detected",
            "severity": "MEDIUM",
            "detail": f"Found urgency phrases: {', '.join(matched[:4])}",
            "explanation": "This message contains language designed to create urgency or fear, which attackers use to bypass careful judgment."
        })
    elif len(matched) == 1:
        findings.append({
            "type": "Mild Urgency Language",
            "severity": "LOW",
            "detail": f"Found phrase: {matched[0]}",
            "explanation": "Contains some urgency language. May be legitimate but worth reviewing carefully."
        })
    return findings, len(matched)


def analyze_email(raw_email):
    findings = []
    urls = []
    body_text = ""

    try:
        msg = email.message_from_string(raw_email)
        from_addr = msg.get("From", "")
        reply_to  = msg.get("Reply-To", "")
        auth_res  = msg.get("Authentication-Results", "")

        if reply_to and reply_to.strip() and reply_to != from_addr:
            findings.append({
                "type": "From/Reply-To Mismatch",
                "severity": "HIGH",
                "detail": f"From: {from_addr} | Reply-To: {reply_to}",
                "explanation": "The sender address and the Reply-To address differ. Replies go to a different person than the apparent sender — a classic phishing technique."
            })

        if auth_res:
            if "spf=fail" in auth_res.lower():
                findings.append({"type":"SPF Fail","severity":"HIGH",
                    "detail":"SPF authentication failed.",
                    "explanation":"This email was sent from a server not authorized for the claimed domain. Someone is impersonating this sender."})
            if "dkim=fail" in auth_res.lower():
                findings.append({"type":"DKIM Fail","severity":"HIGH",
                    "detail":"DKIM signature verification failed.",
                    "explanation":"The email's cryptographic signature is invalid — it may have been forged or tampered with."})
            if "dmarc=fail" in auth_res.lower():
                findings.append({"type":"DMARC Fail","severity":"HIGH",
                    "detail":"DMARC policy check failed.",
                    "explanation":"Strong indicator this email is not from who it claims to be from."})
        else:
            findings.append({"type":"No Authentication Headers","severity":"MEDIUM",
                "detail":"No SPF/DKIM/DMARC results found.",
                "explanation":"Legitimate organizations authenticate their emails. Missing authentication headers suggest this bypassed verification."})

        for part in msg.walk():
            ct = part.get_content_type()
            if ct in ("text/plain","text/html"):
                try:
                    payload = part.get_payload(decode=True).decode("utf-8","ignore")
                    if ct == "text/html":
                        soup = BeautifulSoup(payload, "html.parser")
                        body_text += soup.get_text(separator=" ")
                        for a in soup.find_all("a", href=True):
                            href = a["href"]
                            if href.startswith("http"):
                                urls.append(href)
                    else:
                        body_text += payload
                        urls += extract_urls(payload)
                except Exception:
                    pass

            if part.get_filename():
                fname = part.get_filename().lower()
                for ext in SUSPICIOUS_EXTENSIONS:
                    if fname.endswith(ext):
                        findings.append({"type":"Suspicious Attachment","severity":"HIGH",
                            "detail":f"Attachment '{part.get_filename()}' has high-risk extension ({ext}).",
                            "explanation":f"Files with {ext} extension can execute code. Never open such attachments from unexpected emails."})
    except Exception as e:
        findings.append({"type":"Parse Error","severity":"LOW",
            "detail":f"Could not fully parse email: {str(e)}",
            "explanation":"The email format could not be fully read."})

    return findings, list(set(urls)), body_text


def analyze_text_message(text, channel="sms"):
    """Analyze SMS, Slack, or Teams message"""
    findings = []
    urls = extract_urls(text)

    # Urgency scoring
    urgency_findings, _ = score_urgency(text)
    findings += urgency_findings

    # SMS-specific checks
    if channel == "sms":
        findings += check_smishing_patterns(text)

    # Government impersonation for all text channels
    findings += check_gov_impersonation_text(text)

    return findings, urls, text


def analyze_qr_image(image_bytes):
    from modules.qr_decoder import decode_qr
    urls_raw, method, err = decode_qr(image_bytes)

    if err and not urls_raw:
        return [{
            "type": "QR Decode Failed",
            "severity": "MEDIUM",
            "detail": err,
            "explanation": (
                "PhishGuard 360 could not decode this QR code. "
                "On macOS install dependencies: brew install zbar && pip install pyzbar. "
                "Or: pip install opencv-python. "
                "The QR code may still be malicious — treat it as suspicious."
            )
        }], [], ""

    if not urls_raw:
        return [{"type":"No QR Code Found","severity":"LOW",
            "detail":"No QR code detected in the image.",
            "explanation":"Make sure the image contains a clear, readable QR code."}], [], ""

    urls = [u for u in urls_raw if u.startswith("http")]
    non_url = [u for u in urls_raw if not u.startswith("http")]

    findings = []
    if non_url:
        findings.append({
            "type": "QR Non-URL Content",
            "severity": "LOW",
            "detail": f"QR contains non-URL data: {non_url[0][:80]}",
            "explanation": "This QR code does not contain a web link — may be contact info or plain text."
        })

    body_text = f"QR decoded via {method}: {', '.join(urls_raw)}"
    return findings, urls, body_text


def compute_verdict(score):
    if score >= 70:
        return "MALICIOUS", "danger"
    elif score >= 31:
        return "SUSPICIOUS", "warning"
    else:
        return "CLEAN", "success"


def run_scanner(channel, content, filename=None, vt_api_key=None):
    all_findings = []
    urls = []
    body_text = ""

    # Channel-specific parsing
    if channel == "email":
        ch_findings, urls, body_text = analyze_email(content)
        all_findings += ch_findings
    elif channel in ("slack", "teams", "sms"):
        ch_findings, urls, body_text = analyze_text_message(content, channel)
        all_findings += ch_findings
    elif channel == "qr":
        ch_findings, urls, body_text = analyze_qr_image(content)
        all_findings += ch_findings
        if urls:
            urgency_findings, _ = score_urgency(" ".join(urls))
            all_findings += urgency_findings

    # URL analysis for all channels
    for url in urls[:10]:
        try:
            ext = tldextract.extract(url)
            domain = f"{ext.subdomain}.{ext.domain}.{ext.suffix}".lstrip(".") if ext.subdomain else f"{ext.domain}.{ext.suffix}"
            all_findings += check_lookalike(domain)
            all_findings += check_suspicious_domain(domain, url)
            all_findings += check_domain_age(domain)
            all_findings += check_url_structure(url)
            if vt_api_key:
                all_findings += check_virustotal(url, vt_api_key)
        except Exception:
            pass

    # Urgency scoring on email body
    if channel == "email" and body_text:
        urgency_findings, _ = score_urgency(body_text)
        all_findings += urgency_findings

    # Deduplicate by type+detail
    seen = set()
    unique_findings = []
    for f in all_findings:
        key = f["type"] + f["detail"][:40]
        if key not in seen:
            seen.add(key)
            unique_findings.append(f)

    severity_weights = {"HIGH": 30, "MEDIUM": 15, "LOW": 5}
    raw_score = sum(severity_weights.get(f["severity"], 0) for f in unique_findings)
    score = min(100, raw_score)
    verdict, verdict_class = compute_verdict(score)

    return {
        "channel": channel.upper(),
        "score": score,
        "verdict": verdict,
        "verdict_class": verdict_class,
        "findings": unique_findings,
        "urls_analyzed": urls,
        "body_preview": body_text[:300] if body_text else "",
        "finding_count": len(unique_findings),
        "high_count": sum(1 for f in unique_findings if f["severity"]=="HIGH"),
        "medium_count": sum(1 for f in unique_findings if f["severity"]=="MEDIUM"),
        "low_count": sum(1 for f in unique_findings if f["severity"]=="LOW"),
    }
