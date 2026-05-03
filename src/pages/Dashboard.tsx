import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PageHeader, StatusDot, SectionLabel } from '../components/Layout'
import { SystemHealthGauge } from '../components/SystemHealthGauge'
import { EnergyFlow } from '../components/EnergyFlow'
import { PageTransition } from '../components/PageTransition'
import { useRealtime } from '../lib/useRealtime'
import { useSystemAlerts } from '../lib/toast'
import { powerHistory, agents, layers, initialAlerts } from '../lib/seed'

function LiveMetricTile({
  label, value, unit, color, delta,
}: { label: string; value: string | number; unit?: string; color: string; delta?: string }) {
  return (
    <motion.div
      layout
      className="card card-glow p-3 md:p-4"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="text-[9px] font-display tracking-[0.12em] uppercase text-[var(--color-muted)] mb-1.5">{label}</div>
      <motion.div
        key={String(value)}
        initial={{ opacity: 0.6, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-1"
      >
        <span className="mono text-xl md:text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] text-[var(--color-muted)] mb-0.5">{unit}</span>}
      </motion.div>
      {delta && <div className="text-[9px] text-[var(--color-muted)] mt-1">{delta}</div>}
    </motion.div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="status-dot pulse-dot" style={{ backgroundColor: 'var(--color-green)', width: 6, height: 6 }} />
        <span className="text-[10px] font-display text-[var(--color-green)] tracking-wider uppercase">Live</span>
      </div>
      <span className="mono text-[10px] text-[var(--color-muted)]">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  )
}

const RECENT = powerHistory.slice(72)

export function Dashboard() {
  const live = useRealtime()
  useSystemAlerts()

  const todaySavings = +(live.solar * 6 * 0.14).toFixed(2)
  const todayCO2 = +(live.solar * 6 * 0.42).toFixed(1)
  const activeAgents = agents.filter(a => a.status === 'active').length

  return (
    <PageTransition>
      <div>
        <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h1 className="font-display font-bold text-lg md:text-xl text-[var(--color-text)] tracking-wide">System Overview</h1>
            <p className="text-[10px] text-[var(--color-muted)] font-display tracking-wide">Aurora Core · 7-Layer Cognitive-Energy Ecosystem</p>
          </div>
          <LiveClock />
        </div>

        <div className="p-4 md:p-6 space-y-5">

          {/* Hero row: Health gauge + energy flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemHealthGauge metrics={live} />
            <EnergyFlow metrics={live} />
          </div>

          {/* Live metrics strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <LiveMetricTile label="System Load"   value={live.load}       unit="kW" color="var(--color-amber)"  delta={`Grid draw: ${live.grid} kW`} />
            <LiveMetricTile label="Solar Output"  value={live.solar}      unit="kW" color="var(--color-green)"  delta="Generating now" />
            <LiveMetricTile label="Battery SoC"   value={live.batterySoc} unit="%"  color="var(--color-cyan)"   delta={`${live.batteryCurrent > 0 ? '▲ Charging' : '▼ Discharging'} ${Math.abs(live.batteryCurrent)}A`} />
            <LiveMetricTile label="Active Agents" value={activeAgents}    unit={`/ ${agents.length}`} color="var(--color-purple)" delta={agents.some(a => a.status === 'conflict') ? '⚠ 1 conflict' : 'All nominal'} />
          </div>

          {/* Today's summary bar */}
          <div className="card aurora-gradient p-4">
            <SectionLabel>Today's Summary</SectionLabel>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Energy Savings', v: `$${todaySavings}`, sub: 'vs grid baseline',  color: 'var(--color-green)' },
                { l: 'CO₂ Avoided',   v: `${todayCO2} kg`,    sub: 'from solar offset',  color: 'var(--color-cyan)'  },
                { l: 'Self-Sufficiency', v: `${Math.round((live.solar / live.load) * 100)}%`, sub: 'solar coverage', color: 'var(--color-purple)' },
              ].map(item => (
                <div key={item.l} className="text-center">
                  <div className="mono text-lg md:text-xl font-bold" style={{ color: item.color }}>{item.v}</div>
                  <div className="text-[9px] font-display text-[var(--color-muted)] mt-0.5">{item.l}</div>
                  <div className="text-[8px] text-[var(--color-dim)]">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Power chart */}
          <div className="card p-4">
            <SectionLabel>System Power · Last 6 Hours</SectionLabel>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={RECENT} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  {[['gLoad','amber'],['gSolar','green'],['gGrid','cyan']].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={`var(--color-${c})`} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={`var(--color-${c})`} stopOpacity={0}   />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} interval={7} />
                <YAxis tick={{ fontSize: 8, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} unit="kW" />
                <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11 }} labelStyle={{ color: 'var(--color-muted)' }} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontFamily: 'Exo 2' }} />
                <Area type="monotone" dataKey="load"  name="Load"  stroke="var(--color-amber)" fill="url(#gLoad)"  strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="solar" name="Solar" stroke="var(--color-green)" fill="url(#gSolar)" strokeWidth={1.5} dot={false} />
                <Area type="monotone" dataKey="grid"  name="Grid"  stroke="var(--color-cyan)"  fill="url(#gGrid)"  strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Agent status + Layers side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <SectionLabel>AI Agent Status</SectionLabel>
              <div className="space-y-3">
                {agents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-3">
                    <StatusDot status={agent.status} />
                    <span className="text-xs font-display font-semibold text-[var(--color-text)] w-24 flex-shrink-0">{agent.name}</span>
                    <span className="text-[10px] text-[var(--color-muted)] flex-1 truncate">{agent.action}</span>
                    <span className="mono text-xs flex-shrink-0" style={{ color: agent.color }}>{agent.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <SectionLabel>Cognitive Layers</SectionLabel>
              <div className="space-y-2.5">
                {layers.map(l => (
                  <div key={l.id} className="flex items-center gap-3">
                    <StatusDot status={l.status as 'active' | 'conflict'} />
                    <span className="mono text-[9px] text-[var(--color-muted)] w-20 flex-shrink-0">{l.abbr}</span>
                    <span className="text-xs text-[var(--color-text)] flex-1 truncate">{l.name}</span>
                    <span className="mono text-[9px] flex-shrink-0" style={{ color: l.color }}>{l.throughput}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent alerts */}
          <div className="card p-4">
            <SectionLabel>Recent Activity</SectionLabel>
            <div className="space-y-2">
              {initialAlerts.slice(0, 4).map(alert => (
                <div key={alert.id} className="flex items-start gap-3 py-1">
                  <span className={`text-[9px] mt-0.5 font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0
                    ${alert.type === 'warning' ? 'bg-[oklch(0.80_0.17_72_/_0.15)] text-[var(--color-amber)]'
                    : alert.type === 'error'   ? 'bg-[oklch(0.65_0.22_25_/_0.15)] text-[var(--color-red)]'
                    : alert.type === 'success' ? 'bg-[oklch(0.74_0.17_145_/_0.15)] text-[var(--color-green)]'
                    :                            'bg-[oklch(0.82_0.16_196_/_0.10)] text-[var(--color-cyan)]'}`}>
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

          {/* Footer dedication */}
          <div className="text-center py-2">
            <span className="text-[9px] font-display text-[var(--color-dim)] tracking-[0.2em] uppercase">Aurora Core v2.0 · Built with purpose · For Zachary 💙</span>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
