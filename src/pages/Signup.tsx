import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { Eye, EyeOff, Check, AlertCircle, Loader, CheckCircle } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { signup, user } = useAuth()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [plan, setPlan]         = useState<'free' | 'pro'>(params.get('plan') === 'pro' ? 'pro' : 'free')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState(1)
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    if (params.get('plan') === 'pro') { setPlan('pro'); setStep(2) }
  }, [params])

  if (user) { navigate('/dashboard'); return null }

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setError(''); setStep(2)
  }

  const handleSignup = async () => {
    setLoading(true); setError('')
    const { error: err } = await signup(name, email, password, plan)
    setLoading(false)
    if (err) { setError(err); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 grid-bg">
        <div className="glass-card rounded-2xl p-10 max-w-md w-full text-center animate-fade-scale"
          style={{ border: '1px solid rgba(0,229,160,0.2)' }}>
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,229,160,0.1)] flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-[var(--success)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">Account created!</h1>
          <p className="text-[var(--text-muted)] text-sm mb-3 leading-relaxed">
            {plan === 'pro'
              ? 'Welcome to PhishGuard 360 Pro! Check your email to confirm your account, then sign in.'
              : 'Welcome to PhishGuard 360! Check your email to confirm your account, then sign in.'}
          </p>
          <p className="text-xs text-[var(--text-dim)] mb-6">
            Didn't receive it? Check your spam folder.
          </p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl pro-gradient font-semibold text-sm hover:opacity-90 transition-opacity">
            Go to sign in
          </button>
        </div>
      </div>
    )
  }

  const inputClass = "w-full bg-[var(--surface2)] border border-[var(--border-hi)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm"

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col grid-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.07), transparent 70%)' }} />
        <div className="absolute -bottom-48 -right-48 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <button onClick={() => navigate('/')}><Logo size="md" showMotto /></button>
          </div>

          <div className="glass-card rounded-2xl p-8 sm:p-10 animate-fade-scale"
            style={{ border: '1px solid rgba(0,212,255,0.1)' }}>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-7">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${step >= s ? 'pro-gradient text-white' : 'bg-[var(--surface2)] text-[var(--text-muted)] border border-[var(--border-hi)]'}`}>
                    {step > s ? <Check size={11} /> : s}
                  </div>
                  {s < 2 && <div className={`w-10 h-px transition-all duration-500 ${step > s ? 'bg-[var(--cyan)]' : 'bg-[var(--border-hi)]'}`} />}
                </div>
              ))}
              <span className="text-xs text-[var(--text-muted)] ml-1 font-mono">
                {step === 1 ? 'Account details' : 'Choose plan'}
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.25)] rounded-xl px-4 py-3 mb-5 text-[var(--danger)] text-sm">
                <AlertCircle size={15} />{error}
              </div>
            )}

            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold mb-1 tracking-tight">Create your account</h1>
                <p className="text-[var(--text-muted)] text-sm mb-6">Start protecting your organization today</p>
                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Your full name" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Email address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@company.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                        placeholder="Min. 6 characters" className={inputClass + ' pr-10'} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-sm pro-gradient hover:opacity-90 transition-opacity mt-2">
                    Continue →
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-1 tracking-tight">Choose your plan</h1>
                <p className="text-[var(--text-muted)] text-sm mb-6">Upgrade anytime. Cancel anytime.</p>

                <div className="space-y-3 mb-6">
                  {([
                    { key: 'free', label: 'Free', price: '$0/mo',
                      features: ['Email phishing scanner', 'SPF/DKIM/DMARC analysis', 'Plain-English findings'] },
                    { key: 'pro', label: 'Pro', price: '$5/mo',
                      features: ['Everything in Free', 'QR / SMS / Slack / Teams', 'Session hijack detector', 'Behavior dashboard', 'Scan history'] },
                  ] as const).map(p => (
                    <div key={p.key} onClick={() => setPlan(p.key)}
                      className={`rounded-xl p-4 cursor-pointer border transition-all duration-200 ${plan === p.key
                        ? p.key === 'pro' ? 'border-indigo-500/60 bg-[var(--indigo-dim)]' : 'border-[var(--cyan)] bg-[var(--cyan-dim)]'
                        : 'border-[var(--border-hi)] hover:border-[var(--border-hi)]'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                            ${plan === p.key ? 'border-[var(--cyan)]' : 'border-[var(--text-dim)]'}`}>
                            {plan === p.key && <div className="w-2 h-2 rounded-full bg-[var(--cyan)]" />}
                          </div>
                          <span className="font-semibold text-sm">{p.label}</span>
                        </div>
                        <span className={`text-sm font-bold ${p.key === 'pro' ? 'text-gradient' : 'text-[var(--text-muted)]'}`}>
                          {p.price}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {p.features.map(f => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Check size={10} className={p.key === 'pro' ? 'text-indigo-400' : 'text-[var(--success)]'} />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {plan === 'pro' && (
                  <div className="mb-5 p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-3 font-mono uppercase tracking-wider">Payment details (simulated)</p>
                    <input placeholder="Card number" className={inputClass + ' mb-2'} />
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="MM/YY" className={inputClass} />
                      <input placeholder="CVC" className={inputClass} />
                    </div>
                    <p className="text-xs text-[var(--text-dim)] mt-2 font-mono">* Simulation only. No real charges.</p>
                  </div>
                )}

                <button onClick={handleSignup} disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-sm pro-gradient hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading
                    ? <><Loader size={15} className="animate-spin" /> Creating account…</>
                    : plan === 'pro' ? 'Subscribe & Create Account — $5/mo' : 'Create Free Account'}
                </button>
                <button onClick={() => { setStep(1); setError('') }}
                  className="w-full mt-2 py-2 text-sm text-[var(--text-muted)] hover:text-white transition-colors">
                  ← Back
                </button>
              </>
            )}

            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-[var(--text-muted)] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--cyan)] hover:text-white transition-colors font-semibold">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
