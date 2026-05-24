import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'wouter'
import { Sparkles, Settings, Bell, ArrowUpRight } from 'lucide-react'
import { NeuralCore } from '../components/NeuralCore'
import { HealthPanel } from '../components/HealthPanel'
import { EnergyPanel } from '../components/EnergyPanel'
import { BehaviorPanel } from '../components/BehaviorPanel'
import { EnvironmentPanel } from '../components/EnvironmentPanel'
import { ScoreHistoryChart } from '../components/ScoreHistoryChart'
import { PageTransition } from '../components/PageTransition'
import { useRealtime } from '../hooks/useRealtime'
import { useSystemAlerts } from '../lib/toast'
import { useAuth } from '../lib/auth'
import { initialAlerts } from '../lib/seed'

function Clock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <div className="text-right">
      <div className="mono text-sm font-bold text-[var(--color-text)]">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      <div className="mono text-[9px] text-[var(--color-muted)]">{t.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
    </div>
  )
}

export function Dashboard() {
  const live = useRealtime()
  const { user, isGod } = useAuth()
  const [alertCount] = useState(initialAlerts.filter(a => !a.resolved).length)
  useSystemAlerts()

  return (
    <PageTransition>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── Top bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--color-border)] flex-shrink-0"
          style={{ background: 'rgba(5,11,18,0.9)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-[#00ffc840] bg-[#00ffc808] flex items-center justify-center glow-teal flex-shrink-0">
              <span className="display font-black text-xs gradient-text-aurora">AC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="display font-black text-sm text-[var(--color-text)] tracking-wide">AURORA CORE</span>
                <span className="mono text-[8px] px-1.5 py-0.5 rounded-full border border-[#39ff1440] text-[#39ff14] bg-[#39ff1408]">ALL SYSTEMS SYNCHRONIZED</span>
                {isGod && <span className="mono text-[8px] px-1.5 py-0.5 rounded-full border border-[#ffd60a40] text-[#ffd60a] bg-[#ffd60a08]">⚡ GOD MODE</span>}
              </div>
              <div className="mono text-[9px] text-[var(--color-muted)]">AI-Orchestrated Wellness Ecosystem · {user?.name}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live status dots */}
            <div className="hidden md:flex items-center gap-3">
              {[
                { l: 'LOAD',    v: `${live.load}kW`,        c: '#ffd60a' },
                { l: 'SOLAR',   v: `${live.solar}kW`,       c: '#39ff14' },
                { l: 'BATTERY', v: `${live.batterySoc}%`,   c: '#00ffc8' },
                { l: 'SCORE',   v: `${live.systemScore}`,   c: '#9b5de5' },
              ].map(s => (
                <div key={s.l} className="flex items-center gap-1">
                  <span className="mono text-[8px] text-[var(--color-dim)]">{s.l}</span>
                  <motion.span key={String(s.v)} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}
                    className="mono text-[9px] font-bold" style={{ color: s.c }}>{s.v}</motion.span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/alerts">
                <a className="relative p-1.5 rounded-lg hover:bg-[var(--color-elevated)] transition-colors">
                  <Bell className="w-4 h-4 text-[var(--color-muted)]" />
                  {alertCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#ff3366] mono text-[7px] flex items-center justify-center text-white font-bold">{alertCount}</span>}
                </a>
              </Link>
              <Link href="/settings">
                <a className="p-1.5 rounded-lg hover:bg-[var(--color-elevated)] transition-colors">
                  <Settings className="w-4 h-4 text-[var(--color-muted)]" />
                </a>
              </Link>
              <Clock />
            </div>
          </div>
        </div>

        {/* ── Main content ───────────────────────────────────────── */}
        {/* Desktop: 5-panel mission control */}
        <div className="hidden md:grid flex-1 min-h-0 overflow-hidden"
          style={{ gridTemplateColumns: '1fr 1.4fr 1fr', gridTemplateRows: '1fr 1fr' }}>

          {/* Health - top left */}
          <div className="border-r border-b border-[var(--color-border)] overflow-hidden" style={{ background: 'rgba(255,51,102,0.03)' }}>
            <HealthPanel metrics={live} />
          </div>

          {/* Neural Core - center spans 2 rows */}
          <div className="row-span-2 border-r border-[var(--color-border)] relative overflow-hidden">
            <div className="absolute inset-0 flex flex-col">
              <div className="flex-1 relative">
                <NeuralCore metrics={live} />
              </div>
              {/* Command center bottom strip */}
              <div className="border-t border-[var(--color-border)] p-3 flex-shrink-0"
                style={{ background: 'rgba(5,11,18,0.95)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="mono text-[8px] text-[var(--color-muted)] tracking-[0.2em] uppercase">Aurora Command Center</span>
                  <span className="mono text-[8px] text-[#39ff14]">● Active</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { l: 'Diagnostics', href: '/agents',   c: '#00ffc8' },
                    { l: 'Learning',    href: '/layers',   c: '#9b5de5' },
                    { l: 'Simulation',  href: '/simulation',c: '#ffd60a' },
                    { l: 'TurnBot',     href: '/turnbot',  c: '#39ff14' },
                  ].map(item => (
                    <Link key={item.l} href={item.href}>
                      <a className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ borderColor: item.c + '30', background: item.c + '08' }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.c, boxShadow: `0 0 4px ${item.c}` }} />
                        <span className="mono text-[9px] font-bold" style={{ color: item.c }}>{item.l}</span>
                        <ArrowUpRight className="w-2.5 h-2.5 ml-auto flex-shrink-0" style={{ color: item.c + '80' }} />
                      </a>
                    </Link>
                  ))}
                </div>
                <Link href="/chat">
                  <a className="mt-2 flex items-center gap-2 w-full px-3 py-2 rounded-xl border border-[#00ffc830] bg-[#00ffc808] hover:bg-[#00ffc815] transition-all">
                    <Sparkles className="w-3.5 h-3.5 text-[#00ffc8]" />
                    <span className="mono text-[9px] text-[#00ffc8] font-bold">Ask AURORA Intelligence</span>
                    <ArrowUpRight className="w-3 h-3 ml-auto text-[#00ffc860]" />
                  </a>
                </Link>
              </div>
            </div>
          </div>

          {/* Energy - top right */}
          <div className="border-b border-[var(--color-border)] overflow-hidden" style={{ background: 'rgba(255,214,10,0.03)' }}>
            <EnergyPanel metrics={live} />
          </div>

          {/* Behavior - bottom left */}
          <div className="border-r border-[var(--color-border)] overflow-hidden" style={{ background: 'rgba(155,93,229,0.03)' }}>
            <BehaviorPanel metrics={live} />
          </div>

          {/* Environment - bottom right */}
          <div className="overflow-hidden" style={{ background: 'rgba(57,255,20,0.03)' }}>
            <EnvironmentPanel metrics={live} />
            <ScoreHistoryChart metrics={live} />
          </div>
        </div>

        {/* ── Mobile: vertical scroll layout ─────────────────────── */}
        <div className="md:hidden flex-1 overflow-y-auto space-y-0 divide-y divide-[var(--color-border)]" style={{ paddingBottom: 80 }}>
          {/* Neural core */}
          <div style={{ height: 320, background: 'rgba(0,255,200,0.02)' }}>
            <NeuralCore metrics={live} />
          </div>
          {/* Health */}
          <div style={{ background: 'rgba(255,51,102,0.03)' }}>
            <HealthPanel metrics={live} />
          </div>
          {/* Energy */}
          <div style={{ background: 'rgba(255,214,10,0.03)' }}>
            <EnergyPanel metrics={live} />
          </div>
          {/* Behavior */}
          <div style={{ background: 'rgba(155,93,229,0.03)' }}>
            <BehaviorPanel metrics={live} />
          </div>
          {/* Environment */}
          <div style={{ background: 'rgba(57,255,20,0.03)' }}>
            <EnvironmentPanel metrics={live} />
            <ScoreHistoryChart metrics={live} />
          </div>
          {/* Command links */}
          <div className="p-4 space-y-2">
            <div className="mono text-[8px] text-[var(--color-muted)] tracking-[0.2em] uppercase mb-3">Command Center</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { l: 'AURORA Chat',  href: '/chat',       c: '#00ffc8', icon: '✦' },
                { l: 'Diagnostics',  href: '/agents',     c: '#9b5de5', icon: '◈' },
                { l: 'Simulation',   href: '/simulation', c: '#ffd60a', icon: '⚗' },
                { l: 'TurnBot',      href: '/turnbot',    c: '#39ff14', icon: '⊕' },
                { l: 'Circuits',     href: '/circuits',   c: '#ff3366', icon: '⚡' },
                { l: 'Legacy',       href: '/legacy',     c: '#ff6b35', icon: '💙' },
              ].map(item => (
                <Link key={item.l} href={item.href}>
                  <a className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all active:scale-[0.97]"
                    style={{ borderColor: item.c + '35', background: item.c + '0a' }}>
                    <span className="text-base">{item.icon}</span>
                    <span className="display font-bold text-xs" style={{ color: item.c }}>{item.l}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
