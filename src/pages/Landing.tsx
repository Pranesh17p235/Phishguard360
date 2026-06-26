import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { ChevronDown, Check, Lock, Wifi, QrCode, Mail, MessageSquare, Menu, X, Shield, Zap, Users, AlertTriangle, Eye, Crosshair, Radio } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useReveal } from '../hooks/useReveal'

/* ── Typewriter ── */
function TypewriterHeading({ lines, className = '' }: { lines: string[]; className?: string }) {
  const [displayed, setDisplayed] = useState<string[]>(lines.map(() => ''))
  const [done, setDone] = useState(false)
  useEffect(() => {
    let li = 0, ci = 0
    const tick = () => {
      if (li >= lines.length) { setDone(true); return }
      const line = lines[li]
      if (ci <= line.length) {
        setDisplayed(prev => { const n=[...prev]; n[li]=line.slice(0,ci); return n })
        ci++; setTimeout(tick, ci===1?300:28)
      } else { li++; ci=0; setTimeout(tick, 120) }
    }
    const t = setTimeout(tick, 500)
    return () => clearTimeout(t)
  }, [])
  return (
    <h1 className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block">
          {displayed[i]}
          {i===lines.length-1 && !done && <span className="animate-blink text-[var(--cyan)]">|</span>}
        </span>
      ))}
    </h1>
  )
}

/* ── Radar Orb ── */
function RadarOrb({ size = 220 }: { size?: number }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {[0.9, 0.65, 0.4].map((r, i) => (
        <div key={i} className="absolute rounded-full border border-[rgba(0,212,255,0.12)]"
          style={{ width:`${r*100}%`, height:`${r*100}%`, top:'50%', left:'50%', transform:'translate(-50%,-50%)' }} />
      ))}
      <div className="absolute inset-0 animate-radar" style={{ transformOrigin:'50% 50%' }}>
        <div style={{
          position:'absolute', top:'50%', left:'50%',
          width:'50%', height:'1px',
          background:'linear-gradient(90deg, rgba(0,212,255,0.9), transparent)',
          transformOrigin:'left center'
        }} />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--cyan)] animate-glow" />
      {[{top:'20%',left:'65%',d:'0.4s'},{top:'58%',left:'25%',d:'1.1s'},{top:'72%',left:'70%',d:'2s'}].map((b,i)=>(
        <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-[var(--cyan)]"
          style={{ top:b.top, left:b.left, animation:`glow-pulse 2s ease-in-out infinite ${b.d}`, opacity:0.8 }} />
      ))}
    </div>
  )
}

/* ── Phishing scenario card ── */
function ScenarioCard({ icon: Icon, channel, message, redFlag, delay = 0 }:
  { icon: any; channel: string; message: string; redFlag: string; delay?: number }) {
  return (
    <div className={`reveal glass-card rounded-xl p-5 border border-[var(--border)] hover:border-[rgba(255,61,90,0.3)] transition-all duration-300`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className="text-[var(--text-muted)]" />
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-wider">{channel}</span>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[rgba(255,61,90,0.1)] border border-[rgba(255,61,90,0.25)] text-[var(--danger)] font-mono">THREAT</span>
      </div>
      <p className="text-sm text-[var(--text)] mb-3 font-mono leading-relaxed">"{message}"</p>
      <div className="flex items-start gap-2 pt-3 border-t border-[var(--border)]">
        <AlertTriangle size={12} className="text-[var(--danger)] mt-0.5 flex-shrink-0" />
        <span className="text-xs text-[var(--text-muted)]">{redFlag}</span>
      </div>
    </div>
  )
}

/* ── Stat counter ── */
function Stat({ value, label }: { value: string; label: string }) {
  const [vis, setVis] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect() } }, { threshold: 0.5 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return (
    <div ref={ref} className="text-center">
      <div className={`text-2xl sm:text-3xl font-bold text-gradient transition-all duration-700 ${vis?'opacity-100 translate-y-0':'opacity-0 translate-y-4'}`}>{value}</div>
      <div className="text-[10px] text-[var(--text-muted)] mt-1 font-mono tracking-widest uppercase">{label}</div>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useReveal()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const nav = (path: string) => { setMobileOpen(false); navigate(path) }
  const scrollTo = (id: string) => { setMobileOpen(false); document.getElementById(id)?.scrollIntoView({ behavior:'smooth' }) }
  const goToDashboard = () => nav(user ? '/dashboard' : '/login')

  return (
    <div className="bg-[var(--bg)] text-[var(--text)] overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-8 pt-4">
        <nav className={`liquid-glass rounded-2xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4 transition-all duration-300 ${scrolled?'shadow-2xl':''}`}>
          <button onClick={() => nav('/')}><Logo size="sm" /></button>
          <div className="hidden md:flex items-center gap-6 text-sm">
            {['features','attack-types','pricing','about'].map(id => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-[var(--text-muted)] hover:text-white transition-colors capitalize font-medium">
                {id === 'attack-types' ? 'Threats' : id.charAt(0).toUpperCase()+id.slice(1)}
              </button>
            ))}
            <button onClick={() => nav('/report')} className="text-[var(--danger)] hover:text-red-300 transition-colors flex items-center gap-1.5 text-sm font-medium">
              <span className="text-xs">⚠</span> Report Phishing
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <button onClick={() => nav('/dashboard')} className="pro-gradient px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Dashboard</button>
            ) : (
              <>
                <button onClick={() => nav('/login')} className="text-sm text-[var(--text-muted)] hover:text-white transition-colors px-3 py-2 font-medium">Sign in</button>
                <button onClick={() => nav('/signup')} className="pro-gradient px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">Get started</button>
              </>
            )}
          </div>
          <button className="md:hidden p-2 text-[var(--text-muted)] hover:text-white" onClick={() => setMobileOpen(o=>!o)}>
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </nav>
      </header>

      {/* Mobile overlay — only renders at md breakpoint and below */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-[rgba(5,5,8,0.97)] backdrop-blur-2xl flex flex-col items-center justify-center gap-8 md:hidden">
          <button onClick={() => setMobileOpen(false)} className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white"><X size={24}/></button>
          <Logo size="md" showMotto />
          <div className="flex flex-col items-center gap-6 text-lg font-medium">
            {['features','attack-types','pricing','about'].map(id => (
              <button key={id} onClick={() => scrollTo(id)} className="text-[var(--text-muted)] hover:text-white transition-colors capitalize">
                {id === 'attack-types' ? 'Threats' : id.charAt(0).toUpperCase()+id.slice(1)}
              </button>
            ))}
            <button onClick={() => nav('/report')} className="text-[var(--danger)]">⚠ Report Phishing</button>
          </div>
          <div className="flex flex-col gap-3 w-48">
            <button onClick={() => nav('/signup')} className="pro-gradient px-6 py-3 rounded-xl font-semibold text-center hover:opacity-90">Get started</button>
            <button onClick={() => nav('/login')} className="border border-[var(--border-hi)] px-6 py-3 rounded-xl font-medium text-[var(--text-muted)] hover:text-white text-center">Sign in</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SECTION 1 — HOOK: The threat is real
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col grid-bg pt-24 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle, rgba(0,212,255,0.07), transparent 70%)' }} />

        {/* Video dimmed */}
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-15"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260403_050628_c4e32401-fab4-4a27-b7a8-6e9291cd5959.mp4" />

        <div className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto w-full py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
            <div className="lg:max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] bg-[var(--cyan-dim)] text-[var(--cyan)] text-xs font-mono tracking-widest uppercase mb-6 animate-fade-scale">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-glow inline-block" />
                Active threat monitoring
              </div>
              <TypewriterHeading
                lines={["Protecting every", "channel from phishing."]}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight text-white mb-6"
              />
              <p className="text-base sm:text-lg text-[var(--text-muted)] mb-8 max-w-lg leading-relaxed animate-slide-up"
                style={{ animationDelay:'1.6s', animationFillMode:'backwards' }}>
                Attackers don't just send emails anymore. They hook victims via SMS, Slack, Teams, and QR codes — and they bypass MFA entirely. PhishGuard 360 closes every gap.
              </p>
              <div className="flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay:'1.9s', animationFillMode:'backwards' }}>
                <button onClick={goToDashboard} className="pro-gradient px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base">Start for free</button>
                <button onClick={() => scrollTo('attack-types')} className="liquid-glass border border-[var(--border-hi)] text-white px-7 py-3.5 rounded-xl font-medium hover:border-[var(--cyan)] transition-all text-sm sm:text-base">
                  See how attacks work
                </button>
              </div>
              <div className="flex items-center gap-6 mt-10 animate-slide-up" style={{ animationDelay:'2.1s', animationFillMode:'backwards' }}>
                <Stat value="5" label="Channels" />
                <div className="w-px h-8 bg-[var(--border-hi)]" />
                <Stat value="85%" label="Precision" />
                <div className="w-px h-8 bg-[var(--border-hi)]" />
                <Stat value="<5s" label="Analysis" />
              </div>
            </div>
            <div className="flex justify-center lg:justify-end animate-fade-scale" style={{ animationDelay:'0.6s', animationFillMode:'backwards' }}>
              <RadarOrb size={220} />
            </div>
          </div>
        </div>

        <button onClick={() => scrollTo('attack-types')} className="relative z-10 pb-8 flex flex-col items-center gap-1 text-[var(--text-dim)] hover:text-[var(--cyan)] transition-colors mx-auto">
          <span className="text-xs font-mono tracking-widest uppercase">Scroll to see how phishing works</span>
          <ChevronDown size={18} className="animate-bounce mt-1" />
        </button>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2 — SCROLLYTELLING: Attack types
      ══════════════════════════════════════════ */}
      <section id="attack-types" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-14 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="reveal text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(255,61,90,0.25)] text-[var(--danger)] text-xs font-mono tracking-widest uppercase mb-5">
              How phishing really works
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
              The hook comes from everywhere.
            </h2>
            <p className="text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
              Modern phishing attacks don't look like Nigerian princes. They look exactly like messages from your bank, your boss, or your IT team.
            </p>
          </div>

          {/* Scrolly attack scenarios */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {[
              { icon: Mail, channel: 'Email', delay: 0,
                message: 'Your password expires in 24 hours. Click here to reset immediately.',
                redFlag: 'Urgency language + lookalike domain "paypa1.com" instead of paypal.com' },
              { icon: MessageSquare, channel: 'SMS / Smishing', delay: 100,
                message: 'USPS: Your package is held. Verify address: usps-delivery-now.com',
                redFlag: 'Unsolicited text with suspicious redirect domain — classic smishing.' },
              { icon: QrCode, channel: 'QR Code / Quishing', delay: 200,
                message: '[QR code on a parking meter, coffee shop, or conference badge]',
                redFlag: 'QR codes bypass link filters entirely — the destination URL is hidden.' },
              { icon: Wifi, channel: 'Slack / Teams', delay: 300,
                message: 'Hey! Finance sent over the Q3 file. Can you approve? → [link]',
                redFlag: 'Impersonating a colleague in collaboration tools. Link leads to credential harvester.' },
              { icon: Shield, channel: 'AiTM / Session Hijack', delay: 400,
                message: '[MFA approved ✓] — Attacker silently copies session cookie in real time.',
                redFlag: 'Adversary-in-the-Middle attacks bypass MFA. Standard tools never catch this.' },
              { icon: Users, channel: 'Spear Phishing', delay: 500,
                message: 'Hi Sarah — per our call, here\'s the revised contract. Sign before EOD.',
                redFlag: 'Targeted, personalized attack using public info about the victim. High success rate.' },
            ].map(s => (
              <ScenarioCard key={s.channel} {...s} />
            ))}
          </div>

          {/* Narrative bridge */}
          <div className="reveal glass-card rounded-2xl p-8 sm:p-10 text-center border border-[rgba(0,212,255,0.1)] scan-line-container">
            <div className="inline-block mb-4">
              <Crosshair size={28} className="text-[var(--cyan)] mx-auto animate-glow" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
              One platform. Every attack surface.
            </h3>
            <p className="text-[var(--text-muted)] max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
              No single tool covers all six vectors above. PhishGuard 360 does — including the post-MFA session hijacking gap that every other scanner misses.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3 — FEATURES
      ══════════════════════════════════════════ */}
      <section id="features" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-14 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="reveal text-center mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] text-[var(--cyan)] text-xs font-mono tracking-widest uppercase mb-5">
              Platform features
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Defense across every surface</h2>
            <p className="text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">The only phishing defense platform that covers your entire attack surface in a single dashboard.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {/* Free tier */}
            <div className="reveal reveal-delay-1 glass-card rounded-2xl p-7 sm:p-8 feature-card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[var(--cyan-dim)] flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-[var(--cyan)]" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Email Scanner</div>
                  <div className="text-xs text-[var(--success)] font-mono tracking-wide">FREE — no account needed</div>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-5 leading-relaxed">Analyze any email for phishing indicators — SPF/DKIM/DMARC failures, lookalike domains, urgency language, and more.</p>
              <ul className="space-y-2.5 mb-6">
                {['Header integrity (SPF/DKIM/DMARC)','Lookalike domain detection','URL reputation scoring','Urgency language detection','Plain-English findings'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--text)]">
                    <Check size={13} className="text-[var(--success)] flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={goToDashboard} className="w-full py-2.5 rounded-xl border border-[var(--border-hi)] text-sm font-medium hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-all">
                Try free scanner
              </button>
            </div>

            {/* Pro tier */}
            <div className="reveal reveal-delay-2 relative rounded-2xl p-7 sm:p-8 feature-card"
              style={{ background:'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(99,102,241,0.1))', border:'1px solid rgba(99,102,241,0.25)' }}>
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold pro-gradient tracking-wide">PRO — $5/mo</div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl pro-gradient flex items-center justify-center flex-shrink-0">
                  <Zap size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Full Platform Access</div>
                  <div className="text-xs text-indigo-300 font-mono tracking-wide">Everything included</div>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-5 leading-relaxed">QR scanning, AiTM session hijacking detection, behavioral analytics, and full history.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {[
                  { icon: QrCode, label:'QR Code Scanner', color:'text-[var(--cyan)]' },
                  { icon: Lock, label:'Session Hijack Detector', color:'text-indigo-400' },
                  { icon: Users, label:'Behavior Dashboard', color:'text-violet-400' },
                  { icon: MessageSquare, label:'Slack / SMS / Teams', color:'text-[var(--cyan)]' },
                  { icon: Shield, label:'Scan History Log', color:'text-[var(--success)]' },
                  { icon: Wifi, label:'Priority Analysis', color:'text-indigo-400' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    <Icon size={13} className={`${color} flex-shrink-0`} />
                    <span className="text-[var(--text)]">{label}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => nav('/signup')} className="w-full py-2.5 rounded-xl font-semibold text-sm pro-gradient hover:opacity-90 transition-opacity">
                Get Pro access — $5/mo
              </button>
            </div>
          </div>

          {/* 3 pillars */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Radio, color:'text-[var(--cyan)]', bg:'bg-[var(--cyan-dim)]', title:'Multi-Channel Detection', desc:'Email, Slack, Teams, SMS, and QR codes through one unified engine.' },
              { icon: Eye, color:'text-indigo-400', bg:'bg-[var(--indigo-dim)]', title:'Post-MFA Protection', desc:'AiTM detection catches cookie theft after MFA succeeds — the gap every other tool misses.' },
              { icon: Users, color:'text-violet-400', bg:'bg-violet-500/10', title:'Behavioral Intelligence', desc:'Know which teams are most susceptible. Targeted training, not generic advice.' },
            ].map(({ icon: Icon, color, bg, title, desc }, i) => (
              <div key={title} className={`reveal reveal-delay-${i+1} glass-card feature-card rounded-2xl p-6`}>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-semibold mb-2 text-sm sm:text-base">{title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 4 — PRICING
      ══════════════════════════════════════════ */}
      <section id="pricing" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-14 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="reveal mb-16">
            <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] text-[var(--cyan)] text-xs font-mono tracking-widest uppercase mb-5">Simple pricing</div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Start free. Go Pro when you're ready.</h2>
            <p className="text-[var(--text-muted)]">No hidden fees. No contracts. Cancel anytime.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            <div className="reveal reveal-delay-1 glass-card feature-card rounded-2xl p-7 sm:p-8 text-left">
              <div className="text-xs font-mono text-[var(--text-dim)] mb-3 uppercase tracking-widest">Free</div>
              <div className="text-4xl font-bold mb-1">$0</div>
              <div className="text-[var(--text-muted)] text-sm mb-6">Forever free</div>
              <ul className="space-y-3 mb-8 text-sm">
                {['Email phishing scanner','SPF / DKIM / DMARC analysis','Lookalike domain detection','URL reputation scoring','Plain-English findings'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[var(--text)]"><Check size={13} className="text-[var(--success)]" />{f}</li>
                ))}
                {['QR code scanner','Session hijack detector','Behavior dashboard','Scan history'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[var(--text-dim)]"><Lock size={11} className="text-[var(--text-dim)]" />{f}</li>
                ))}
              </ul>
              <button onClick={() => nav('/signup')} className="w-full py-3 rounded-xl border border-[var(--border-hi)] text-sm font-semibold hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-all">
                Get started free
              </button>
            </div>
            <div className="reveal reveal-delay-2 relative rounded-2xl p-7 sm:p-8 text-left feature-card"
              style={{ background:'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(99,102,241,0.1))', border:'1px solid rgba(99,102,241,0.3)' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold pro-gradient whitespace-nowrap">Most Popular</div>
              <div className="text-xs font-mono text-indigo-300 mb-3 uppercase tracking-widest">Pro</div>
              <div className="text-4xl font-bold mb-1 text-gradient">$5</div>
              <div className="text-[var(--text-muted)] text-sm mb-6">per month</div>
              <ul className="space-y-3 mb-8 text-sm">
                {['Everything in Free','QR code phishing scanner','AiTM session hijack detector','Human susceptibility dashboard','Full scan history & audit log','Slack / Teams / SMS analysis','Priority analysis engine'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-[var(--text)]">
                    <Check size={13} className={f==='Everything in Free'?'text-[var(--cyan)]':'text-indigo-400'} />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => nav('/signup?plan=pro')} className="w-full py-3 rounded-xl font-semibold text-sm pro-gradient hover:opacity-90 transition-opacity">
                Get Pro — $5/mo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5 — ABOUT
      ══════════════════════════════════════════ */}
      <section id="about" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-14 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="reveal-left">
              <div className="inline-block px-4 py-1.5 rounded-full border border-[rgba(0,212,255,0.2)] text-[var(--cyan)] text-xs font-mono tracking-widest uppercase mb-5">Our mission</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-5 tracking-tight leading-tight">Built by a security researcher, for everyone.</h2>
              <p className="text-[var(--text-muted)] mb-4 leading-relaxed text-sm sm:text-base">
                PhishGuard 360 was developed as part of the CSEC 594 Security Capstone at DePaul University. It addresses three gaps no existing free tool covers: modern non-email attack channels, post-MFA session hijacking, and unmeasured human behavioral vulnerability.
              </p>
              <p className="text-[var(--text-muted)] mb-8 leading-relaxed text-sm sm:text-base">
                All analysis runs locally. No data leaves your machine. No cloud dependencies. No privacy concerns.
              </p>
              <div className="flex items-center gap-6 sm:gap-8">
                <Stat value="5" label="Channels" />
                <div className="w-px h-10 bg-[var(--border-hi)]" />
                <Stat value="85%" label="Precision" />
                <div className="w-px h-10 bg-[var(--border-hi)]" />
                <Stat value="<5s" label="Speed" />
              </div>
            </div>
            <div className="reveal-right">
              <div className="glass-card feature-card rounded-2xl p-7 sm:p-8">
                <Logo size="lg" showMotto />
                <div className="mt-6 space-y-4">
                  {[
                    { label:'Research-grade detection', desc:'Built with academic rigor and tested against real phishing samples.' },
                    { label:'Privacy-first design', desc:'All analysis runs locally. Your data never leaves your environment.' },
                    { label:'Plain-English results', desc:'Every finding explained clearly — no cybersecurity background required.' },
                  ].map(({ label, desc }) => (
                    <div key={label} className="border-t border-[var(--border)] pt-4">
                      <div className="font-semibold text-sm mb-1">{label}</div>
                      <div className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 6 — CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 px-4 sm:px-8 lg:px-14">
        <div className="max-w-3xl mx-auto">
          <div className="reveal glass-card scan-line-container rounded-3xl p-10 sm:p-14 text-center"
            style={{ border:'1px solid rgba(0,212,255,0.12)' }}>
            <div className="flex justify-center mb-6"><Logo size="md" showMotto /></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Ready to defend every channel?</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">Start scanning for free. Upgrade to Pro for full platform access at $5/month.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => nav('/signup')} className="pro-gradient px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm sm:text-base">Start free today</button>
              <button onClick={() => nav('/login')} className="border border-[var(--border-hi)] px-8 py-3.5 rounded-xl font-medium hover:border-[var(--cyan)] hover:text-[var(--cyan)] transition-all text-sm sm:text-base">Sign in</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border)] py-8 px-4 sm:px-8 lg:px-14">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" showMotto />
          <div className="text-[var(--text-dim)] text-xs text-center font-mono">
            © 2026 PhishGuard 360 
          </div>
          <div className="flex gap-5 text-sm text-[var(--text-muted)]">
            <button onClick={() => nav('/login')} className="hover:text-white transition-colors">Sign in</button>
            <button onClick={() => nav('/signup')} className="hover:text-white transition-colors">Sign up</button>
            <a href="https://github.com/Pranesh17p235/Phishguard360" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
