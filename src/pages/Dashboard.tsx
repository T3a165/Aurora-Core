import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Link } from 'wouter'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageTransition } from '../components/PageTransition'
import { SystemHealthGauge } from '../components/SystemHealthGauge'
import { EnergyFlow } from '../components/EnergyFlow'
import { StatusDot, SectionLabel } from '../components/Layout'
import { useRealtime } from '../lib/useRealtime'
import { useSystemAlerts } from '../lib/toast'
import { powerHistory, agents, layers, initialAlerts } from '../lib/seed'

const RECENT = powerHistory.slice(72)

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  return (
    <div className="flex items-center gap-2">
      <span className="status-dot pulse-dot" style={{ backgroundColor: 'var(--color-green)', width: 6, height: 6 }} />
      <span className="mono text-[10px] text-[var(--color-muted)]">{t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  )
}

function LiveTile({ label, value, unit, color, sub, href }: {
  label: string; value: string | number; unit?: string; color: string; sub?: string; href?: string
}) {
  const inner = (
    <motion.div
      className="card card-glow p-3 md:p-4 relative overflow-hidden cursor-default"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}08, transparent 70%)` }} />
      <div className="text-[9px] font-display tracking-[0.12em] uppercase text-[var(--color-muted)] mb-1.5">{label}</div>
      <motion.div key={String(value)} initial={{ opacity: 0.5, y: 4 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-1">
        <span className="mono text-xl md:text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] text-[var(--color-muted)] mb-0.5">{unit}</span>}
      </motion.div>
      {sub && <div className="text-[9px] text-[var(--color-muted)] mt-1">{sub}</div>}
      {href && <ArrowRight className="absolute bottom-3 right-3 w-3 h-3 text-[var(--color-dim)] opacity-0 group-hover:opacity-100 transition-opacity" />}
    </motion.div>
  )
  if (href) return <Link href={href}><a className="group">{inner}</a></Link>
  return inner
}

export function Dashboard() {
  const live = useRealtime()
  useSystemAlerts()

  const savings = +(live.solar * 6 * 0.14).toFixed(2)
  const co2     = +(live.solar * 6 * 0.42).toFixed(1)
  const selfSuf = Math.min(100, Math.round((live.solar / live.load) * 100))
  const activeAgents = agents.filter(a => a.status === 'active').length

  return (
    <PageTransition>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl text-[var(--color-text)] tracking-wide">Mission Control</h1>
            <p className="text-[10px] text-[var(--color-muted)] font-display">Aurora Core · L1–L7 All Nominal · <span className="text-[var(--color-green)]">System Online</span></p>
          </div>
          <LiveClock />
        </div>

        <div className="p-4 md:p-6 space-y-5">

          {/* Hero row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemHealthGauge metrics={live} />
            <EnergyFlow metrics={live} />
          </div>

          {/* Live metric tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            <LiveTile label="System Load"   value={live.load}        unit="kW"          color="var(--color-amber)"  sub={`Grid: ${live.grid.toFixed(2)} kW`}                  href="/circuits"   />
            <LiveTile label="Solar Output"  value={live.solar}       unit="kW"          color="var(--color-green)"  sub="Generating now"                                       href="/battery"    />
            <LiveTile label="Battery SoC"   value={live.batterySoc}  unit="%"           color="var(--color-cyan)"   sub={`${live.batteryCurrent > 0 ? '▲ Chg' : '▼ Dch'} ${Math.abs(live.batteryCurrent)}A`} href="/battery" />
            <LiveTile label="AI Agents"     value={activeAgents}     unit={`/${agents.length}`} color="var(--color-purple)" sub={agents.some(a => a.status === 'conflict') ? '⚠ 1 conflict' : 'All nominal'} href="/agents" />
          </div>

          {/* Today snapshot */}
          <div className="card aurora-gradient p-4">
            <SectionLabel>Today's Impact</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Energy Saved',     v: `$${savings}`,   sub: 'vs grid-only baseline',  c: 'var(--color-green)'  },
                { l: 'CO₂ Avoided',      v: `${co2} kg`,     sub: 'solar displacement',     c: 'var(--color-cyan)'   },
                { l: 'Self-Sufficient',  v: `${selfSuf}%`,   sub: 'solar coverage',         c: 'var(--color-purple)' },
              ].map(item => (
                <div key={item.l} className="text-center">
                  <div className="mono text-lg md:text-xl font-bold" style={{ color: item.c }}>{item.v}</div>
                  <div className="text-[9px] font-display text-[var(--color-muted)] mt-0.5 leading-tight">{item.l}</div>
                  <div className="text-[8px] text-[var(--color-dim)]">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Power chart */}
          <div className="card p-4">
            <SectionLabel>System Power · Last 6 Hours</SectionLabel>
            <ResponsiveContainer width="100%" height={170}>
              <AreaChart data={RECENT} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  {(['amber','green','cyan'] as const).map(c => (
                    <linearGradient key={c} id={`g${c}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={`var(--color-${c})`} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={`var(--color-${c})`} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} interval={7} />
                <YAxis tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} unit="kW" />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: 'var(--color-muted)' }} />
                <Area type="monotone" dataKey="load"  name="Load"  stroke="var(--color-amber)" fill="url(#gamber)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="solar" name="Solar" stroke="var(--color-green)" fill="url(#ggreen)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="grid"  name="Grid"  stroke="var(--color-cyan)"  fill="url(#gcyan)"  strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Agents + Layers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/agents">
              <a className="card p-4 block hover:card-active transition-all">
                <SectionLabel>AI Agent Consensus</SectionLabel>
                <div className="space-y-2.5">
                  {agents.map(a => (
                    <div key={a.id} className="flex items-center gap-3">
                      <StatusDot status={a.status} />
                      <span className="text-xs font-display font-semibold text-[var(--color-text)] w-24 flex-shrink-0">{a.name}</span>
                      <span className="text-[10px] text-[var(--color-muted)] flex-1 truncate">{a.action}</span>
                      <span className="mono text-xs flex-shrink-0" style={{ color: a.color }}>{a.confidence}%</span>
                    </div>
                  ))}
                </div>
              </a>
            </Link>

            <Link href="/layers">
              <a className="card p-4 block hover:card-active transition-all">
                <SectionLabel>Cognitive Stack</SectionLabel>
                <div className="space-y-2">
                  {layers.map(l => (
                    <div key={l.id} className="flex items-center gap-3">
                      <StatusDot status={l.status as 'active' | 'conflict'} />
                      <span className="mono text-[9px] text-[var(--color-dim)] w-20 flex-shrink-0">{l.abbr}</span>
                      <span className="text-xs text-[var(--color-text)] flex-1 truncate">{l.name}</span>
                      <span className="mono text-[9px] flex-shrink-0" style={{ color: l.color }}>{l.throughput}</span>
                    </div>
                  ))}
                </div>
              </a>
            </Link>
          </div>

          {/* Recent alerts */}
          <div className="card p-4">
            <SectionLabel>Recent Activity</SectionLabel>
            <div className="space-y-2">
              {initialAlerts.slice(0, 4).map(alert => (
                <div key={alert.id} className="flex items-start gap-3">
                  <span className={`text-[9px] mt-0.5 font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                    alert.type === 'warning' ? 'bg-[oklch(0.80_0.17_72_/_0.15)] text-[var(--color-amber)]'
                    : alert.type === 'error'  ? 'bg-[oklch(0.65_0.22_25_/_0.15)] text-[var(--color-red)]'
                    : alert.type === 'success'? 'bg-[oklch(0.74_0.17_145_/_0.15)] text-[var(--color-green)]'
                    :                           'bg-[oklch(0.82_0.16_196_/_0.10)] text-[var(--color-cyan)]'}`}>
                    {alert.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--color-text)] truncate">{alert.title}</div>
                    <div className="text-[9px] text-[var(--color-muted)] truncate">{alert.message}</div>
                  </div>
                  <span className="mono text-[9px] text-[var(--color-dim)] flex-shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ask AURORA CTA */}
          <Link href="/chat">
            <motion.a
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="card aurora-gradient p-4 flex items-center gap-4 cursor-pointer hover:card-active transition-all block"
            >
              <div className="w-10 h-10 rounded-xl border border-[oklch(0.82_0.16_196_/_0.4)] bg-[oklch(0.82_0.16_196_/_0.10)] flex items-center justify-center flex-shrink-0 glow-cyan">
                <Sparkles className="w-5 h-5 text-[var(--color-cyan)]" />
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-sm text-[var(--color-text)]">Ask AURORA</div>
                <div className="text-[10px] text-[var(--color-muted)]">Active decision core with system tools · Powered by Claude Sonnet</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--color-cyan)] flex-shrink-0" />
            </motion.a>
          </Link>

          {/* Dedication */}
          <div className="text-center py-2">
            <span className="text-[9px] font-display text-[var(--color-dim)] tracking-[0.2em] uppercase">Aurora Core v2.0 · McLain Systems · Built for Zachary 💙</span>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
