import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { Eye, EyeOff, AlertCircle, Loader } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error: err } = await login(email, password)
    setLoading(false)
    if (err) { setError('Invalid email or password. Please try again.'); return }
    if (email === 'admin@phishguard360.com') navigate('/admin')
    else navigate('/dashboard')
  }

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col grid-bg">
      {/* Ambient glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)' }} />
        <div className="absolute -bottom-48 -left-48 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.07), transparent 70%)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <button onClick={() => navigate('/')}><Logo size="md" showMotto /></button>
          </div>

          <div className="glass-card rounded-2xl p-8 sm:p-10 animate-fade-scale"
            style={{ border: '1px solid rgba(0,212,255,0.1)' }}>
            <h1 className="text-2xl font-bold mb-1 tracking-tight">Welcome back</h1>
            <p className="text-[var(--text-muted)] text-sm mb-8">Sign in to your PhishGuard 360 account</p>

            {error && (
              <div className="flex items-center gap-2.5 bg-[rgba(255,61,90,0.08)] border border-[rgba(255,61,90,0.25)] rounded-xl px-4 py-3 mb-6 text-[var(--danger)] text-sm">
                <AlertCircle size={15} />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@company.com"
                  className="w-full bg-[var(--surface2)] border border-[var(--border-hi)] rounded-xl px-4 py-3 text-white placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-2 font-mono uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full bg-[var(--surface2)] border border-[var(--border-hi)] rounded-xl px-4 py-3 pr-10 text-white placeholder-[var(--text-dim)] focus:outline-none focus:border-[var(--cyan)] transition-colors text-sm" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm pro-gradient hover:opacity-90 transition-opacity disabled:opacity-50 mt-2 flex items-center justify-center gap-2">
                {loading ? <><Loader size={15} className="animate-spin" /> Signing in…</> : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
              <p className="text-[var(--text-muted)] text-sm">
                No account?{' '}
                <Link to="/signup" className="text-[var(--cyan)] hover:text-white transition-colors font-semibold">
                  Sign up free
                </Link>
              </p>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-[var(--surface2)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-dim)] font-mono mb-1 uppercase tracking-widest">Note</p>
              <p className="text-xs text-[var(--text-muted)]">
                After signing up, check your email for a confirmation link. Use the same credentials you registered with.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
