import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { Users, Crown, LogOut, TrendingUp, Activity, ChevronRight } from 'lucide-react'

const MOCK_USERS = [
  { id: 1, name: 'Demo User', email: 'demo@example.com', plan: 'free', joined: '2026-05-01', scans: 12 },
  { id: 2, name: 'Pro User', email: 'pro@example.com', plan: 'pro', joined: '2026-05-10', scans: 47 },
  { id: 3, name: 'Alice Johnson', email: 'alice@acme.com', plan: 'pro', joined: '2026-05-15', scans: 89 },
  { id: 4, name: 'Bob Smith', email: 'bob@startup.io', plan: 'free', joined: '2026-05-20', scans: 5 },
  { id: 5, name: 'Carol Lee', email: 'carol@corp.com', plan: 'pro', joined: '2026-06-01', scans: 34 },
]

export default function Admin() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'overview' | 'users' | 'reports'>('overview')

  if (user?.role !== 'admin') {
    navigate('/dashboard')
    return null
  }

  const proUsers = MOCK_USERS.filter(u => u.plan === 'pro').length
  const totalRevenue = proUsers * 5

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-3 flex items-center justify-between bg-black/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/')}><Logo size="sm" /></button>
          <span className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-medium">ADMIN PANEL</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button onClick={() => { logout(); navigate('/') }} className="text-gray-400 hover:text-white transition-colors p-2">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-1">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">PhishGuard 360 platform management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl bg-white/5 w-fit">
          {(['overview', 'users', 'reports'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: MOCK_USERS.length, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { label: 'Pro Subscribers', value: proUsers, icon: Crown, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { label: 'Monthly Revenue', value: `$${totalRevenue}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { label: 'Total Scans', value: MOCK_USERS.reduce((s, u) => s + u.scans, 0), icon: Activity, color: 'text-violet-400', bg: 'bg-violet-500/10' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="glass-card rounded-2xl p-5 border border-white/5">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className={color} />
                  </div>
                  <div className="text-2xl font-semibold mb-1">{value}</div>
                  <div className="text-gray-400 text-xs">{label}</div>
                </div>
              ))}
            </div>

            {/* Recent users */}
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-medium">Recent Users</h2>
                <button onClick={() => setTab('users')} className="text-sky-400 text-sm flex items-center gap-1 hover:text-sky-300 transition-colors">
                  View all <ChevronRight size={14} />
                </button>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-white/5">
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Plan</th>
                  <th className="px-6 py-3 text-left">Scans</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                </tr></thead>
                <tbody>
                  {MOCK_USERS.slice(0, 4).map((u, i) => (
                    <tr key={u.id} className={`border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">{u.name[0]}</div>
                          <div>
                            <div className="font-medium text-sm">{u.name}</div>
                            <div className="text-gray-500 text-xs">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-gray-400'}`}>
                          {u.plan.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-300">{u.scans}</td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{u.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="font-medium">All Users ({MOCK_USERS.length})</h2>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-white/5">
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Scans</th>
                <th className="px-6 py-3 text-left">Revenue</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {MOCK_USERS.map((u, i) => (
                  <tr key={u.id} className={`border-t border-white/5 ${i % 2 === 0 ? '' : 'bg-white/1'}`}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium">{u.name[0]}</div>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-gray-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-gray-400'}`}>
                        {u.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-300">{u.scans}</td>
                    <td className="px-6 py-3 text-emerald-400 text-xs">{u.plan === 'pro' ? '$5/mo' : '—'}</td>
                    <td className="px-6 py-3 text-gray-400 text-xs">{u.joined}</td>
                    <td className="px-6 py-3">
                      <button className="text-xs text-sky-400 hover:text-sky-300 transition-colors">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
