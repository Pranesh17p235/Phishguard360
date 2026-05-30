"""
PhishGuard 360 - Main Flask Application
"""
import os, json
from flask import Flask, render_template, request, redirect, url_for, jsonify
from modules.scanner import run_scanner
from modules.session import analyze_sessions, parse_session_log, SAMPLE_LOG
from modules.susceptibility import analyze_campaign, parse_csv, SAMPLE_CSV
from modules.history import load_history, add_entry, delete_entries, clear_all

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
os.makedirs(os.path.join(os.path.dirname(__file__), "uploads"), exist_ok=True)
VT_API_KEY = os.environ.get("VT_API_KEY", "")

@app.route("/")
def index():
    history = load_history()
    stats = {
        "total": len(history),
        "malicious": sum(1 for h in history if h["verdict"] == "MALICIOUS"),
        "suspicious": sum(1 for h in history if h["verdict"] == "SUSPICIOUS"),
        "clean": sum(1 for h in history if h["verdict"] == "CLEAN"),
    }
    return render_template("index.html", history=history[:5], stats=stats)

@app.route("/scanner", methods=["GET","POST"])
def scanner():
    result, error = None, None
    channel = request.args.get("channel", "email").strip().lower()
    valid = ["email","slack","teams","sms","qr"]
    if channel not in valid:
        channel = "email"

    if request.method == "POST":
        channel = request.form.get("channel", "email").strip().lower()
        if channel not in valid:
            channel = "email"
        try:
            if channel == "qr":
                f = request.files.get("qr_file")
                if not f or f.filename == "":
                    error = "Please upload a QR code image."
                else:
                    content = f.read()
                    result = run_scanner("qr", content, vt_api_key=VT_API_KEY)
                    preview = f"QR image: {f.filename}"
            elif channel == "email":
                f = request.files.get("eml_file")
                content = f.read().decode("utf-8","ignore") if f and f.filename else request.form.get("email_text","").strip()
                if not content:
                    error = "Please upload an .eml file or paste email content."
                else:
                    result = run_scanner("email", content, vt_api_key=VT_API_KEY)
                    preview = content[:200]
            else:
                content = request.form.get("message_text","").strip()
                if not content:
                    error = f"Please paste a {channel.upper()} message."
                else:
                    result = run_scanner(channel, content, vt_api_key=VT_API_KEY)
                    preview = content[:200]

            if result:
                add_entry(
                    channel=result["channel"],
                    verdict=result["verdict"],
                    score=result["score"],
                    finding_count=result["finding_count"],
                    high_count=result["high_count"],
                    medium_count=result["medium_count"],
                    low_count=result["low_count"],
                    findings=result["findings"],
                    input_preview=preview if channel != "qr" else f"QR image uploaded"
                )
        except Exception as e:
            error = f"Analysis error: {str(e)}"

    return render_template("scanner.html", result=result, error=error, channel=channel)

@app.route("/session", methods=["GET","POST"])
def session():
    result, error = None, None
    if request.method == "POST":
        action = request.form.get("action","")
        raw = SAMPLE_LOG if action == "use_sample" else request.form.get("session_log","").strip()
        fmt = "json"
        if not raw:
            f = request.files.get("log_file")
            if f and f.filename:
                raw = f.read().decode("utf-8","ignore")
                fmt = "json" if f.filename.endswith(".json") else "csv"
        if not raw:
            error = "Please provide session log data or use the sample."
        else:
            sessions, parse_err = parse_session_log(raw, fmt)
            if parse_err:
                error = f"Could not parse log: {parse_err}"
            elif not sessions:
                error = "No session entries found."
            else:
                result = analyze_sessions(sessions)
                if result:
                    add_entry(
                        channel="SESSION",
                        verdict=result["verdict"],
                        score=result["score"],
                        finding_count=result["finding_count"],
                        high_count=result["high_count"],
                        medium_count=result["medium_count"],
                        low_count=0,
                        findings=result["findings"],
                        input_preview=raw[:200]
                    )
    return render_template("session.html", result=result, error=error, sample=SAMPLE_LOG)

@app.route("/susceptibility", methods=["GET","POST"])
def susceptibility():
    result, error = None, None
    if request.method == "POST":
        action = request.form.get("action","")
        raw = SAMPLE_CSV if action == "use_sample" else ""
        if not raw:
            f = request.files.get("csv_file")
            raw = f.read().decode("utf-8","ignore") if f and f.filename else request.form.get("csv_text","").strip()
        if not raw:
            error = "Please upload a GoPhish CSV or use sample data."
        else:
            rows, parse_err = parse_csv(raw)
            if parse_err:
                error = f"Could not parse CSV: {parse_err}"
            elif not rows:
                error = "No data rows found."
            else:
                result = analyze_campaign(rows)
                if result:
                    add_entry(
                        channel="CAMPAIGN",
                        verdict=f"{result['overall_click_rate']}% click rate",
                        score=min(100, int(result['overall_click_rate'])),
                        finding_count=len(result.get("risk_segments",[])),
                        high_count=sum(1 for s in result.get("risk_segments",[]) if s["risk_level"]=="HIGH"),
                        medium_count=sum(1 for s in result.get("risk_segments",[]) if s["risk_level"]=="MEDIUM"),
                        low_count=0,
                        findings=[],
                        input_preview=raw[:200]
                    )
    return render_template("susceptibility.html", result=result, error=error)

@app.route("/history")
def history():
    entries = load_history()
    return render_template("history.html", entries=entries)

@app.route("/history/delete", methods=["POST"])
def history_delete():
    ids = request.form.getlist("entry_ids")
    if ids:
        delete_entries(ids)
    return redirect(url_for("history"))

@app.route("/history/clear", methods=["POST"])
def history_clear():
    clear_all()
    return redirect(url_for("history"))

if __name__ == "__main__":
    print("\n" + "="*50)
    print("  PhishGuard 360 — Starting up")
    print("  Open: http://127.0.0.1:5000")
    print("="*50 + "\n")
    import os; port = int(os.environ.get("PORT", 5000)); app.run(debug=False, host="0.0.0.0", port=port)