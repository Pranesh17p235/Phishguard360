import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { scanContent } from '../lib/api'
import type { ScanResult, Finding } from '../lib/api'
import {
  LogOut, Lock, Users, Clock, Shield, AlertTriangle,
  CheckCircle, XCircle, Crown, Menu, X, Zap, Wifi
} from 'lucide-react'

function VerdictBadge({ verdict }: { verdict: string }) {
  const cfg = verdict === 'MALICIOUS'
    ? { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', Icon: XCircle }
    : verdict === 'SUSPICIOUS'
    ? { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', Icon: AlertTriangle }
    : { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', Icon: CheckCircle }
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${cfg.bg}`}>
      <cfg.Icon size={18} className={cfg.color} />
      <span className={`font-bold text-xl ${cfg.color}`}>{verdict}</span>
    </div>
  )
}

function FindingCard({ f }: { f: Finding }) {
  const colors = { HIGH: 'border-red-500 bg-red-500/20 text-red-400', MEDIUM: 'border-yellow-500 bg-yellow-500/20 text-yellow-400', LOW: 'border-gray-600 bg-gray-500/20 text-gray-400' }
  return (
    <div className={`glass-card rounded-xl p-4 border-l-2 ${f.severity === 'HIGH' ? 'border-red-500' : f.severity === 'MEDIUM' ? 'border-yellow-500' : 'border-gray-600'}`}>
      <div className="flex gap-2 items-start">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 border ${colors[f.severity]}`}>{f.severity}</span>
        <div className="min-w-0">
          <div className="font-medium text-sm flex items-center gap-2">
            {f.type}
            {f.source && f.source !== 'Heuristic' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/20">{f.source}</span>
            )}
          </div>
          <div className="text-gray-400 text-xs mt-0.5 break-words">{f.detail}</div>
          <div className="text-gray-500 text-xs mt-1 italic">{f.explanation}</div>
        </div>
      </div>
    </div>
  )
}

function ProGate({ feature, onUpgrade }: { feature: string; onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 glass-card rounded-2xl border border-white/5">
      <Crown size={32} className="text-indigo-400 mb-4" />
      <h3 className="font-semibold mb-2">{feature} — Pro Feature</h3>
      <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">Upgrade to PhishGuard 360 Pro for $5/mo to unlock this feature.</p>
      <button onClick={onUpgrade} className="pro-gradient px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
        Upgrade to Pro — $5/mo
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user, logout, upgradeToPro } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'scanner' | 'session' | 'behavior' | 'history'>('scanner')
  const [channel, setChannel] = useState<'email' | 'sms' | 'slack' | 'teams'>('email')
  const [input, setInput] = useState('')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [apiStatus, setApiStatus] = useState<'idle' | 'calling' | 'done'>('idle')

  const isPro = user?.plan === 'pro' || user?.role === 'admin'

  const handleScan = async () => {
    if (!input.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    setApiStatus('calling')

    try {
      const res = await scanContent(channel, input)
      setResult(res)
      setApiStatus('done')
      const entry = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        channel: res.channel,
        verdict: res.verdict,
        score: res.score,
        high: res.high_count,
        medium: res.medium_count,
        preview: input.slice(0, 80),
        apis: res.apis_used,
      }
      setHistory(h => [entry, ...h].slice(0, 50))
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Make sure the backend is running.')
      setApiStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    await upgradeToPro()
    setShowUpgradeModal(false)
  }

  const navItems = [
    { key: 'scanner', label: 'Scanner', icon: Shield },
    { key: 'session', label: 'Session Detector', icon: Lock, pro: true },
    { key: 'behavior', label: 'Behavior', icon: Users, pro: true },
    { key: 'history', label: 'History', icon: Clock },
  ]

  const channels = [
    { key: 'email', label: 'EMAIL', pro: false },
    { key: 'sms', label: 'SMS', pro: false },
    { key: 'slack', label: 'SLACK', pro: true },
    { key: 'teams', label: 'TEAMS', pro: true },
  ]

  return (
    <div className="min-h-screen bg-black flex flex-col">

      {/* Upgrade modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center border border-indigo-500/30">
            <Crown size={40} className="text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upgrade to Pro</h2>
            <p className="text-gray-400 text-sm mb-6">Unlock QR scanning, session hijacking detection, behavioral analytics, and full scan history for just $5/month.</p>
            <button onClick={handleUpgrade} className="w-full py-3 rounded-xl pro-gradient font-medium mb-3 hover:opacity-90 transition-opacity">
              Upgrade Now — $5/mo
            </button>
            <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 text-sm hover:text-white transition-colors">
              Maybe later
            </button>
            <p className="text-xs text-gray-600 mt-3">* Simulated upgrade for demo purposes.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')}><Logo size="sm" /></button>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ key, label, icon: Icon, pro: proReq }) => (
              <button key={key}
                onClick={() => { if (proReq && !isPro) { setShowUpgradeModal(true); return } setTab(key as any) }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${tab === key ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                <Icon size={15} />{label}
                {proReq && !isPro && <Crown size={10} className="text-indigo-400" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isPro && (
            <button onClick={() => setShowUpgradeModal(true)}
              className="hidden md:flex items-center gap-1.5 pro-gradient px-4 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              <Crown size={12} />Upgrade to Pro
            </button>
          )}
          {isPro && <span className="hidden md:block text-xs px-3 py-1 rounded-full pro-gradient font-medium">PRO</span>}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="max-w-32 truncate">{user?.name}</span>
          </div>
          <button onClick={() => { logout(); navigate('/') }} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5">
            <LogOut size={16} />
          </button>
          <button className="md:hidden text-gray-400 p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenu && (
        <div className="md:hidden border-b border-white/5 px-4 py-3 space-y-1 bg-black/95">
          {navItems.map(({ key, label, icon: Icon, pro: proReq }) => (
            <button key={key}
              onClick={() => { if (proReq && !isPro) { setShowUpgradeModal(true); setMobileMenu(false); return } setTab(key as any); setMobileMenu(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${tab === key ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
              <Icon size={15} />{label}
              {proReq && !isPro && <Crown size={11} className="text-indigo-400 ml-auto" />}
            </button>
          ))}
        </div>
      )}

      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">

        {/* ── SCANNER ── */}
        {tab === 'scanner' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-semibold mb-0.5">Phishing Scanner</h1>
                <p className="text-gray-400 text-sm">Powered by Google Safe Browsing + VirusTotal + AI heuristics</p>
              </div>
              {apiStatus === 'calling' && (
                <div className="flex items-center gap-2 text-xs text-sky-400 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20">
                  <Wifi size={12} className="animate-pulse" />
                  Querying APIs...
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-5 gap-6">
              {/* Input panel */}
              <div className="md:col-span-2 glass-card rounded-2xl p-6 border border-white/5">
                {/* Channel selector */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Input Channel</label>
                  <div className="flex flex-wrap gap-2">
                    {channels.map(ch => (
                      <button key={ch.key}
                        onClick={() => { if (ch.pro && !isPro) { setShowUpgradeModal(true); return } setChannel(ch.key as any); setResult(null); setError('') }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${channel === ch.key ? 'bg-sky-500 border-sky-500 text-white' : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'}`}>
                        {ch.label}
                        {ch.pro && !isPro && <Crown size={9} className="text-indigo-300" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">
                  {channel === 'email' ? 'Email Content (headers + body)' : `${channel.toUpperCase()} Message`}
                </label>
                <textarea
                  value={input} onChange={e => setInput(e.target.value)} rows={11}
                  placeholder={channel === 'email'
                    ? 'From: security@paypa1.com\nReply-To: harvest@evil.ru\nAuthentication-Results: spf=fail dkim=fail\n\nDear Customer, your account has been suspended...'
                    : `Paste the suspicious ${channel} message here...`}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none focus:border-sky-500 transition-colors text-sm resize-none font-mono"
                />

                <button onClick={handleScan} disabled={loading || !input.trim()}
                  className="mt-4 w-full py-2.5 rounded-xl pro-gradient font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</>
                    : <><Zap size={15} />Run Analysis</>}
                </button>

                {/* API status legend */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs text-gray-500 mb-2">Detection engines:</p>
                  <div className="space-y-1">
                    {[
                      { name: 'Google Safe Browsing', active: true },
                      { name: 'VirusTotal (70+ vendors)', active: true },
                      { name: 'WHOIS Domain Age', active: true },
                      { name: 'AI Heuristics', active: true },
                    ].map(e => (
                      <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className={`w-1.5 h-1.5 rounded-full ${e.active ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                        {e.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results panel */}
              <div className="md:col-span-3">
                {error && (
                  <div className="glass-card rounded-2xl p-5 border border-red-500/30 bg-red-500/5 mb-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <XCircle size={16} /><span className="font-medium text-sm">Analysis Error</span>
                    </div>
                    <p className="text-gray-400 text-sm">{error}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Make sure the Flask backend is running: <code className="text-sky-400">python app.py</code> in the phishguard-backend folder.
                    </p>
                  </div>
                )}

                {result ? (
                  <div className="space-y-3">
                    {/* Verdict card */}
                    <div className={`glass-card rounded-2xl p-5 border ${result.verdict === 'MALICIOUS' ? 'border-red-500/30' : result.verdict === 'SUSPICIOUS' ? 'border-yellow-500/30' : 'border-emerald-500/30'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Verdict — {result.channel}</p>
                          <VerdictBadge verdict={result.verdict} />
                        </div>
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${result.score >= 70 ? 'text-red-400' : result.score >= 31 ? 'text-yellow-400' : 'text-emerald-400'}`}>{result.score}</div>
                          <div className="text-xs text-gray-500">Risk / 100</div>
                        </div>
                      </div>
                      <div className="flex gap-5">
                        <div><div className="text-xl font-semibold text-red-400">{result.high_count}</div><div className="text-xs text-gray-500">HIGH</div></div>
                        <div><div className="text-xl font-semibold text-yellow-400">{result.medium_count}</div><div className="text-xs text-gray-500">MEDIUM</div></div>
                        <div><div className="text-xl font-semibold text-gray-500">{result.low_count}</div><div className="text-xs text-gray-500">LOW</div></div>
                      </div>

                      {/* APIs used */}
                      {result.apis_used && (
                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2">
                          {result.apis_used.google_safe_browsing && <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ Google Safe Browsing</span>}
                          {result.apis_used.virustotal && <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ VirusTotal</span>}
                          {result.apis_used.whois && <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✓ WHOIS</span>}
                          <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">✓ AI Heuristics</span>
                        </div>
                      )}
                    </div>

                    {/* Findings */}
                    {result.findings.length === 0 ? (
                      <div className="glass-card rounded-xl p-5 text-center border border-emerald-500/20">
                        <CheckCircle size={24} className="text-emerald-400 mx-auto mb-2" />
                        <p className="text-emerald-400 font-medium text-sm">No threats detected</p>
                        <p className="text-gray-500 text-xs mt-1">All checks passed across {Object.keys(result.apis_used || {}).length} detection engines.</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Findings ({result.finding_count})</p>
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                          {result.findings.map((f, i) => <FindingCard key={i} f={f} />)}
                        </div>
                      </>
                    )}

                    {/* URLs analyzed */}
                    {result.urls_analyzed.length > 0 && (
                      <div className="glass-card rounded-xl p-4 border border-white/5">
                        <p className="text-xs text-gray-500 mb-2">{result.urls_analyzed.length} URL(s) analyzed:</p>
                        {result.urls_analyzed.slice(0, 4).map((url, i) => (
                          <code key={i} className="block text-xs text-gray-400 truncate">{url}</code>
                        ))}
                        {result.urls_analyzed.length > 4 && <p className="text-xs text-gray-600 mt-1">+{result.urls_analyzed.length - 4} more</p>}
                      </div>
                    )}
                  </div>
                ) : !error ? (
                  <div className="glass-card rounded-2xl h-full min-h-64 flex items-center justify-center border border-white/5">
                    <div className="text-center text-gray-600 p-8">
                      <Shield size={40} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Submit content to run analysis</p>
                      <p className="text-xs mt-1 opacity-70">Google Safe Browsing + VirusTotal + AI</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* ── SESSION ── */}
        {tab === 'session' && (
          isPro ? (
            <div className="text-center py-20">
              <Lock size={40} className="mx-auto mb-4 text-indigo-400" />
              <h2 className="text-xl font-semibold mb-2">Session Hijacking Detector</h2>
              <p className="text-gray-400 text-sm mb-4">Detects AiTM post-MFA session cookie theft.</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Run the PhishGuard 360 Python app locally for full session log analysis. The full detector is available in the desktop application.</p>
            </div>
          ) : <ProGate feature="Session Hijacking Detector" onUpgrade={() => setShowUpgradeModal(true)} />
        )}

        {/* ── BEHAVIOR ── */}
        {tab === 'behavior' && (
          isPro ? (
            <div className="text-center py-20">
              <Users size={40} className="mx-auto mb-4 text-violet-400" />
              <h2 className="text-xl font-semibold mb-2">Behavioral Analytics Dashboard</h2>
              <p className="text-gray-400 text-sm mb-4">Upload GoPhish campaign CSV for click-rate segmentation.</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">Full behavioral analytics with department-level risk scoring available in the desktop application.</p>
            </div>
          ) : <ProGate feature="Behavioral Analytics" onUpgrade={() => setShowUpgradeModal(true)} />
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-semibold mb-0.5">Scan History</h1>
              <p className="text-gray-400 text-sm">All scans from this session.</p>
            </div>
            {history.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-white/5">
                <Clock size={32} className="mx-auto mb-3 text-gray-700" />
                <p className="text-gray-400 text-sm">No scans yet. Run an analysis to see history here.</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
                <table className="w-full text-sm">
                  <thead className="border-b border-white/5">
                    <tr className="text-xs text-gray-400 uppercase tracking-wide">
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Channel</th>
                      <th className="px-4 py-3 text-left">Verdict</th>
                      <th className="px-4 py-3 text-left">Score</th>
                      <th className="px-4 py-3 text-left hidden md:table-cell">APIs Used</th>
                      <th className="px-4 py-3 text-left hidden lg:table-cell">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={h.id} className={`border-t border-white/5 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{h.timestamp}</td>
                        <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-300">{h.channel}</span></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${h.verdict === 'MALICIOUS' ? 'text-red-400' : h.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {h.verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-sm">{h.score}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex gap-1 flex-wrap">
                            {h.apis?.google_safe_browsing && <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400">GSB</span>}
                            {h.apis?.virustotal && <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">VT</span>}
                            {h.apis?.whois && <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">WHOIS</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-xs hidden lg:table-cell">{h.preview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}
