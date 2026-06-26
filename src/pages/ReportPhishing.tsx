import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import {
  Shield, AlertTriangle, Globe, Mail, Send, CheckCircle,
  Lock, Zap, Eye, Flag
} from 'lucide-react'

const THREAT_TYPES = [
  { key: 'phishing',  label: 'Phishing',   icon: Mail,          color: 'text-sky-400',    border: 'border-sky-500',  bg: 'bg-sky-500/10' },
  { key: 'scam',      label: 'Scam',        icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  { key: 'malware',   label: 'Malware',     icon: Shield,        color: 'text-red-400',    border: 'border-red-500',  bg: 'bg-red-500/10' },
  { key: 'spam',      label: 'Spam',        icon: Globe,         color: 'text-gray-400',   border: 'border-gray-500', bg: 'bg-gray-500/10' },
]

const SEVERITIES = [
  { key: 'low',      label: 'Low',      desc: 'Minor risk',       color: 'severity-low' },
  { key: 'medium',   label: 'Medium',   desc: 'Moderate risk',    color: 'severity-medium' },
  { key: 'high',     label: 'High',     desc: 'Serious threat',   color: 'severity-high' },
  { key: 'critical', label: 'Critical', desc: 'Immediate danger', color: 'severity-critical' },
]

const PARTNERS = [
  'Google Safe Browsing', 'PhishTank', 'OpenPhish', 'URLhaus',
  'VirusTotal', 'Abuse.ch', 'CIRCL', 'CISA', 'FBI IC3',
  'Netcraft', 'Spamhaus', 'SURBL', 'URIBL', 'APWG',
  'Microsoft MSTIC', 'Cloudflare', 'Quad9', 'OpenDNS',
  'MalwareBytes', 'Sophos', 'Kaspersky', 'Avast',
  'Bitdefender', 'ESET', 'F-Secure', 'Trend Micro',
  'McAfee', 'Symantec', 'Palo Alto', 'CrowdStrike',
]


export default function ReportPhishing() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [threatType, setThreatType] = useState('phishing')
  const [severity, setSeverity] = useState('high')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [reportId, setReportId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) { setError('Please enter a URL to report.'); return }
    if (!url.startsWith('http') && !url.includes('.')) { setError('Please enter a valid URL or domain.'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('phishing_reports')
        .insert({
          url: url.trim(),
          threat_type: threatType,
          severity,
          details: details.trim() || null,
          reporter_email: email.trim() || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (dbErr) throw dbErr
      setReportId(data?.id?.slice(0, 8).toUpperCase() || 'UNKNOWN')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center animate-fade-scale">
          {/* Success animation */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDelay: '0.2s' }} />
            <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle size={40} className="text-emerald-400" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-2">Report Submitted</h1>
          <p className="text-gray-400 mb-2">Report ID: <code className="text-sky-400 font-mono">PG360-{reportId}</code></p>
          <p className="text-gray-500 text-sm mb-8">
            Your report has been stored in our database and will be reviewed.
            {email && ' We\'ll notify you when it\'s processed.'}
          </p>

          {/* What happens next */}
          <div className="glass-card rounded-2xl p-6 text-left mb-6 border border-white/5">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-400">What happens next</h3>
            <div className="space-y-3">
              {[
                { icon: Eye, text: 'Our team reviews the reported URL', time: '< 24 hours' },
                { icon: Shield, text: 'Added to PhishGuard 360 threat database', time: '< 48 hours' },
                { icon: Globe, text: 'Submitted to partner security services', time: '< 72 hours' },
              ].map(({ icon: Icon, text, time }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{text}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => { setSuccess(false); setUrl(''); setEmail(''); setDetails('') }}
              className="pro-gradient px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
              Report Another
            </button>
            <button onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl text-sm border border-white/10 hover:bg-white/5 transition-colors">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15), transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.12), transparent)', filter: 'blur(60px)' }} />
        {/* Grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 px-6 md:px-12 py-4 flex items-center justify-between">
        <button onClick={() => navigate('/')}><Logo size="sm" /></button>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-sm text-gray-400 hover:text-white transition-colors">Home</button>
          <button onClick={() => navigate('/dashboard')} className="text-sm pro-gradient px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Dashboard
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/5 text-red-400 text-sm mb-6">
            <Flag size={14} />
            Community Threat Intelligence
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Report <span className="text-gradient-danger">Phishing</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Report phishing websites, scam URLs, and malicious domains to our threat intelligence database.
            Free, anonymous, no account required.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-10">
            {[
              { num: '30+', label: 'Security Services' },
              { num: '100%', label: 'Free & Anonymous' },
              { num: '<24h', label: 'Review Time' },
              { num: '∞', label: 'Reports Accepted' },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gradient">{num}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-2xl p-6 md:p-8 border border-white/5 card-glow">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Flag size={18} className="text-red-400" />
                Submit a Report
              </h2>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 text-red-400 text-sm">
                  <AlertTriangle size={15} />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phishing URL or Domain <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text" value={url} onChange={e => setUrl(e.target.value)}
                      placeholder="https://fake-paypal-login.ru/verify"
                      className="w-full bg-white/3 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1.5">Paste the full phishing URL including path and parameters</p>
                </div>

                {/* Threat Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Threat Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {THREAT_TYPES.map(({ key, label, icon: Icon, color, border, bg }) => (
                      <button
                        key={key} type="button"
                        onClick={() => setThreatType(key)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-sm font-medium ${
                          threatType === key
                            ? `${border} ${bg} ${color}`
                            : 'border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300'
                        }`}>
                        <Icon size={16} className={threatType === key ? color : 'text-gray-600'} />
                        {label}
                        {threatType === key && (
                          <div className="ml-auto w-4 h-4 rounded-full bg-current opacity-80 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Severity Level</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEVERITIES.map(({ key, label, desc, color }) => (
                      <button
                        key={key} type="button"
                        onClick={() => setSeverity(key)}
                        className={`p-3 rounded-xl border text-xs font-medium transition-all text-center ${
                          severity === key
                            ? `${color} border-current`
                            : 'border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-400'
                        }`}>
                        <div className="font-semibold mb-0.5">{label}</div>
                        <div className="opacity-70 text-[10px] hidden md:block">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Additional Details</label>
                  <textarea
                    value={details} onChange={e => setDetails(e.target.value)} rows={3}
                    placeholder="Describe what you observed — who it's impersonating, what it's asking for, how you encountered it..."
                    className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors text-sm resize-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Email <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com — get notified when processed"
                      className="w-full bg-white/3 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-sky-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-white/2 border border-white/5">
                  <Lock size={13} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Reports are anonymous by default. Your email (if provided) is only used to notify you and is never shared. We store a hashed version of your IP to prevent abuse.
                  </p>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-semibold pro-gradient hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm glow-border">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                  ) : (
                    <><Send size={16} />Report Phishing Now</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right side */}
          <div className="lg:col-span-2 space-y-5">
            {/* How it works */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-gray-400">How it works</h3>
              <div className="space-y-4">
                {[
                  { step: '01', title: 'You submit the URL', desc: 'Paste any suspicious link, domain, or full URL.' },
                  { step: '02', title: 'We analyze it', desc: 'Our system cross-references threat databases instantly.' },
                  { step: '03', title: 'Stored in our DB', desc: 'Added to PhishGuard 360\'s threat intelligence database.' },
                  { step: '04', title: 'Protects everyone', desc: 'Future scans flag this URL automatically for all users.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg pro-gradient flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security partners */}
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold mb-1 text-sm uppercase tracking-wide text-gray-400">Security Partners</h3>
              <p className="text-xs text-gray-600 mb-4">Your report helps protect users across these platforms</p>
              <div className="flex flex-wrap gap-1.5">
                {PARTNERS.map(p => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded bg-white/4 border border-white/6 text-gray-500">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Quick tip */}
            <div className="rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
              <div className="flex items-start gap-2">
                <Zap size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-yellow-400 mb-1">Pro Tip</div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    For faster analysis, use the <button onClick={() => navigate('/dashboard')} className="text-sky-400 hover:underline">Scanner</button> first to check if the URL is already known malicious, then report it here to add it to our database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 px-6 text-center">
        <p className="text-gray-600 text-xs">© 2026 PhishGuard 360 · Protect. Serve. Secure.</p>
      </footer>
    </div>
  )
}
