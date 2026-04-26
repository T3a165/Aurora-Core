import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PageHeader, MetricCard, StatusDot, SectionLabel } from '../components/Layout'
import { powerHistory, agents, layers, initialAlerts } from '../lib/seed'

const RECENT_POWER = powerHistory.slice(72) // last 6h

export function Dashboard() {
  const activeAgents = agents.filter(a => a.status === 'active').length
  const conflictAgents = agents.filter(a => a.status === 'conflict').length

  return (
    <div>
      <PageHeader
        title="System Overview"
        subtitle="Aurora Core · 7-Layer Cognitive-Energy Ecosystem"
      />

      <div className="p-6 space-y-6">
        {/* Quick metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="System Load"   value="9.17" unit="kW"  color="var(--color-amber)"  delta="↑ 0.3 kW vs 1h avg" />
          <MetricCard label="Solar Output"  value="3.42" unit="kW"  color="var(--color-green)"  delta="Peak: 4.8 kW at 13:00" />
          <MetricCard label="Battery SoC"   value="74"   unit="%"   color="var(--color-cyan)"   delta="Discharging · −8.4A" />
          <MetricCard label="Active Agents" value={activeAgents} unit={`/ ${agents.length}`} color="var(--color-purple)" delta={conflictAgents ? `${conflictAgents} conflict` : 'All nominal'} />
        </div>

        {/* Power chart */}
        <div className="card p-4">
          <SectionLabel>System Power · Last 6 Hours</SectionLabel>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={RECENT_POWER} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gLoad"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-amber)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-amber)" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-green)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-green)" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="gGrid"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-cyan)"  stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-cyan)"  stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} interval={7} />
              <YAxis tick={{ fontSize: 9, fill: 'var(--color-muted)', fontFamily: 'Share Tech Mono' }} unit="kW" />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: 11 }}
                labelStyle={{ color: 'var(--color-muted)' }}
              />
              <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, fontFamily: 'Exo 2' }} />
              <Area type="monotone" dataKey="load"  name="Load (kW)"  stroke="var(--color-amber)" fill="url(#gLoad)"  strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="solar" name="Solar (kW)" stroke="var(--color-green)" fill="url(#gSolar)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="grid"  name="Grid (kW)"  stroke="var(--color-cyan)"  fill="url(#gGrid)"  strokeWidth={1.5} dot={false} />
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
