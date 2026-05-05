import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, Activity } from 'lucide-react'
import { useAuth } from '../lib/auth'

export function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode]       = useState<'login' | 'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const submit = async () => {
    setError('')
    if (!email || !password) { setError('Email and password required'); return }
    if (mode === 'signup' && !name) { setError('Name required'); return }
    setLoading(true)
    try {
      if (mode === 'login') await login(email, password)
      else await signup(email, password, name)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[var(--color-bg)] flex flex-col items-center justify-center px-6 grid-overlay">
      {/* Aurora orbs */}
      <div className="aurora-orb-1" style={{ opacity: 0.35 }} />
      <div className="aurora-orb-2" style={{ opacity: 0.25 }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.82_0.16_196_/_0.10)] border border-[oklch(0.82_0.16_196_/_0.4)] flex items-center justify-center glow-cyan">
            <Activity className="w-7 h-7 text-[var(--color-cyan)]" />
          </div>
          <div className="text-center">
            <div className="font-display font-black text-2xl gradient-text-aurora tracking-wider">AURORA CORE</div>
            <div className="text-[10px] text-[var(--color-muted)] font-display tracking-[0.25em] uppercase mt-0.5">Cognitive-Energy Ecosystem</div>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-4">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-[var(--color-elevated)] p-1 gap-1">
            {(['login', 'signup'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-md text-xs font-display font-semibold transition-all capitalize ${
                  mode === m
                    ? 'bg-[oklch(0.82_0.16_196_/_0.15)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.3)]'
                    : 'text-[var(--color-muted)]'
                }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">

              {mode === 'signup' && (
                <div>
                  <label className="text-[10px] font-display uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">Name</label>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-display uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  placeholder="you@example.com"
                  className="w-full bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-display uppercase tracking-wider text-[var(--color-muted)] block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="••••••••"
                    className="w-full bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] outline-none focus:border-[var(--color-cyan)] transition-colors"
                  />
                  <button onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-[11px] text-[var(--color-red)] font-display bg-[oklch(0.65_0.22_25_/_0.10)] border border-[oklch(0.65_0.22_25_/_0.3)] rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <motion.button
                onClick={submit} disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-lg text-sm font-display font-bold transition-all disabled:opacity-50 mt-1"
                style={{ background: 'linear-gradient(135deg, oklch(0.84 0.17 196), oklch(0.70 0.22 290))', color: 'oklch(0.07 0.022 240)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
              </motion.button>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* God mode hint */}
        {mode === 'login' && (
          <p className="text-center text-[9px] text-[var(--color-dim)] font-display mt-3 tracking-wide">
            God access: garrettmclain96@gmail.com
          </p>
        )}

        <p className="text-center text-[9px] text-[var(--color-dim)] font-display mt-2 tracking-[0.15em] uppercase">
          Aurora Core v2.0 · Built for Zachary 💙
        </p>
      </motion.div>
    </div>
  )
}
