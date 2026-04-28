import { useState, useEffect, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PageHeader, MetricCard, StatusDot, SectionLabel } from '../components/Layout'
import { agents, layers, initialAlerts } from '../lib/seed'

// ── Live data types ───────────────────────────────────────────
type PowerPoint = { label: string; solar: number; load: number; grid: number }

const rng = (base: number, variance: number) =>
  +(base + (Math.random() - 0.5) * variance * 2).toFixed(2)

const makePoint = (
  prev: { solar: number; load: number },
  idx: number,
): PowerPoint => {
  const h   = new Date().getHours()
  const m   = new Date().getMinutes()
  const now = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const solar = h >= 7 && h <= 19
    ? rng(prev.solar, 0.3)
    : 0
  const load = rng(prev.load, 0.25)
  const grid = Math.max(0, load - solar)
  return { label: idx === 0 ? now : `T-${72 - idx}`, solar, load, grid }
}

export function Dashboard() {
  const activeAgents   = agents.filter(a => a.status === 'active').length
  const conflictAgents = agents.filter(a => a.status === 'conflict').length

  // ── Live metrics ──────────────────────────────────────────────
  const [metrics, setMetrics] = useState({
    load:    9.17,
    solar:   3.42,
    battery: 74,
    grid:    5.75,
  })

  // ── Scrolling power chart (last 72 points = 18 min at 15s tick) ──
  const seedPoint: PowerPoint = { label: '00:00', solar: 3.42, load: 9.17, grid: 5.75 }
  const [chart, setChart] = useState<PowerPoint[]>(() =>
    Array.from({ length: 72 }, (_, i) => ({
      label: `T-${71 - i}`,
      solar: i > 28 && i < 68 ? rng(3.4, 0.6) : rng(0.2, 0.2),
      load:  rng(2.2, 0.9),
      grid:  rng(0.8, 0.4),
    }))
  )
  const tickRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1
      setMetrics(prev => {
        const h     = new Date().getHours()
        const solar = h >= 7 && h <= 19 ? rng(prev.solar, 0.18) : 0
        const load  = rng(prev.load, 0.15)
        return {
          load:    Math.max(0.5, load),
          solar:   Math.max(0, solar),
          battery: Math.max(10, Math.min(100, prev.battery + (Math.random() > 0.5 ? -0.1 : 0.05))),
          grid:    Math.max(0, load - solar),
        }
      })
      setChart(prev => {
        const last = prev[prev.length - 1]
        const next = makePoint({ solar: last.solar, load: last.load }, tickRef.current)
        return [...prev.slice(1), next]
      })
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <PageHeader
        title="System Overview"
        subtitle="Aurora Core · 7-Layer Cognitive-Energy Ecosystem · Live"
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Quick metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="System Load"
            value={metrics.load.toFixed(2)}
            unit="kW"
            color="var(--color-amber)"
            delta={`Grid draw: ${metrics.grid.toFixed(2)} kW`}
          />
          <MetricCard
            label="Solar Output"
            value={metrics.solar.toFixed(2)}
            unit="kW"
            color="var(--color-green)"
            delta={metrics.solar > metrics.load ? '↑ Net positive' : `Deficit: ${(metrics.load - metrics.solar).toFixed(2)} kW`}
          />
          <MetricCard
            label="Battery SoC"
            value={Math.round(metrics.battery)}
            unit="%"
            color="var(--color-cyan)"
            delta={metrics.battery > 80 ? 'Fully charged' : metrics.battery < 20 ? '⚠ Low — charging' : 'Normal cycle'}
          />
          <MetricCard
            label="Active Agents"
            value={activeAgents}
            unit={`/ ${agents.length}`}
            color="var(--color-purple)"
            delta={conflictAgents ? `${conflictAgents} conflict` : 'All nominal'}
          />
        </div>

        {/* Live power chart */}
        <div className="card p-4">
          <SectionLabel>System Power · Live (updating every 3s)</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-amber)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-amber)" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-green)" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gGrid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-cyan)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-cyan)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }}
                interval={17}
              />
              <YAxis
                tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }}
                unit="kW"
              />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: 'var(--color-muted)' }}
              />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontFamily: 'Exo 2' }} />
              <Area type="monotone" dataKey="load"  name="Load (kW)"  stroke="var(--color-amber)" fill="url(#gLoad)"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="solar" name="Solar (kW)" stroke="var(--color-green)" fill="url(#gSolar)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="grid"  name="Grid (kW)"  stroke="var(--color-cyan)"  fill="url(#gGrid)"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent status */}
          <div className="card p-4">
            <SectionLabel>AI Agent Status</SectionLabel>
            <div className="space-y-3">
              {agents.map(agent => (
                <div key={agent.id} className="flex items-center gap-3">
                  <StatusDot status={agent.status} />
                  <span className="text-xs font-display font-semibold text-[var(--color-text)] w-28">{agent.name}</span>
                  <span className="text-xs text-[var(--color-muted)] flex-1 truncate">{agent.action}</span>
                  <span className="mono text-xs" style={{ color: agent.color }}>{agent.confidence}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cognitive layers */}
          <div className="card p-4">
            <SectionLabel>Cognitive Layers</SectionLabel>
            <div className="space-y-2.5">
              {layers.map(l => (
                <div key={l.id} className="flex items-center gap-3">
                  <StatusDot status={l.status as 'active' | 'conflict'} />
                  <span className="mono text-[10px] text-[var(--color-muted)] w-24">{l.abbr}</span>
                  <span className="text-xs text-[var(--color-text)] flex-1 truncate">{l.name}</span>
                  <span className="mono text-[10px]" style={{ color: l.color }}>{l.throughput}</span>
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
                <span className={`text-[10px] mt-0.5 font-display font-bold uppercase tracking-wider px-1.5 py-0.5 rounded
                  ${alert.type === 'warning' ? 'bg-[oklch(0.80_0.17_72_/_0.15)] text-[var(--color-amber)]'
                  : alert.type === 'error'   ? 'bg-[oklch(0.65_0.22_25_/_0.15)] text-[var(--color-red)]'
                  : alert.type === 'success' ? 'bg-[oklch(0.74_0.17_145_/_0.15)] text-[var(--color-green)]'
                  :                            'bg-[oklch(0.82_0.16_196_/_0.10)] text-[var(--color-cyan)]'}`}>
                  {alert.type}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--color-text)] truncate">{alert.title}</div>
                  <div className="text-[10px] text-[var(--color-muted)] truncate">{alert.message}</div>
                </div>
                <span className="mono text-[10px] text-[var(--color-dim)] flex-shrink-0">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
