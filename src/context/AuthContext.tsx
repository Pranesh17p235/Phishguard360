import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro'
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (name: string, email: string, password: string, plan: 'free' | 'pro') => Promise<{ error?: string }>
  logout: () => Promise<void>
  upgradeToPro: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const ADMIN_EMAIL = 'admin@phishguard360.com'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Build our User object from Supabase session + profile
  const buildUser = async (supabaseUser: any): Promise<User | null> => {
    if (!supabaseUser) return null
    // Fetch profile from DB
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single()

    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name: profile?.name ?? supabaseUser.user_metadata?.name ?? supabaseUser.email ?? '',
      plan: profile?.plan ?? 'free',
      role: supabaseUser.email === ADMIN_EMAIL ? 'admin' : 'user',
    }
  }

  // On mount — check for existing session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = await buildUser(session.user)
        setUser(u)
      }
      setLoading(false)
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = await buildUser(session.user)
        setUser(u)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return {}
  }

  const signup = async (name: string, email: string, password: string, plan: 'free' | 'pro') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, plan },
        emailRedirectTo: window.location.origin + '/dashboard',
      },
    })
    if (error) return { error: error.message }
    return {}
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const upgradeToPro = async () => {
    if (!user) return
    await supabase.from('profiles').update({ plan: 'pro' }).eq('id', user.id)
    setUser({ ...user, plan: 'pro' })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, upgradeToPro }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
