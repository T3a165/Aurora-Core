import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import type { LiveMetrics } from '../types'
import { powerHistory } from '../lib/seed'

function FlowBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] text-[var(--color-muted)] tracking-wider">{label}</span>
        <span className="mono text-[10px] font-bold" style={{ color }}>{value} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}80` }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
    </div>
  )
}

const RECENT = powerHistory.slice(60)

export function EnergyPanel({ metrics }: { metrics: LiveMetrics }) {
  const { solar, load, grid, batterySoc, batteryCurrent } = metrics
  const isCharging = batteryCurrent > 0

  return (
    <div className="h-full flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-[#ffd60a] text-sm">⚡</span>
        <span className="display font-black text-sm text-[#ffd60a]" style={{ textShadow: '0 0 12px #ffd60a80' }}>ENERGY</span>
        <span className="mono text-[9px] text-[var(--color-muted)] ml-auto">LIVE</span>
        <span className="status-dot pulse-dot" style={{ backgroundColor: '#ffd60a', width: 5, height: 5 }} />
      </div>

      {/* Solar Flow boxes */}
      <div className="grid grid-cols-3 gap-2 flex-shrink-0">
        {[
          { l: 'SOLAR',   v: solar,            u: 'kW', c: '#39ff14', icon: '☀️' },
          { l: 'BATTERY', v: batterySoc,        u: '%',  c: '#00ffc8', icon: '🔋' },
          { l: 'GRID',    v: grid.toFixed(2),   u: 'kW', c: '#ffd60a', icon: '⚡' },
        ].map(item => (
          <div key={item.l} className="card p-2.5 text-center" style={{ borderColor: item.c + '30', background: item.c + '08' }}>
            <div className="text-base mb-1">{item.icon}</div>
            <div className="mono font-black text-lg leading-none" style={{ color: item.c, textShadow: `0 0 8px ${item.c}60` }}>{item.v}</div>
            <div className="mono text-[8px] text-[var(--color-muted)] mt-0.5">{item.u}</div>
            <div className="mono text-[7px] tracking-widest text-[var(--color-dim)] uppercase mt-0.5">{item.l}</div>
          </div>
        ))}
      </div>

      {/* Flow bars */}
      <div className="card p-3 flex-shrink-0 space-y-2.5" style={{ borderColor: '#ffd60a18' }}>
        <div className="mono text-[8px] text-[var(--color-muted)] tracking-[0.15em] uppercase mb-1">Solar Flow</div>
        <FlowBar label="Solar Generation" value={solar}     max={6}   color="#39ff14" unit="kW" />
        <FlowBar label="Total Load"       value={load}      max={15}  color="#ffd60a" unit="kW" />
        <FlowBar label="Battery SoC"      value={batterySoc} max={100} color="#00ffc8" unit="%"  />
        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[var(--color-border)]">
          <span className="mono text-[8px] text-[var(--color-muted)]">Battery</span>
          <span className="mono text-[9px] font-bold" style={{ color: isCharging ? '#39ff14' : '#ffd60a' }}>
            {isCharging ? '▲ CHARGING' : '▼ DISCHARGING'} {Math.abs(batteryCurrent).toFixed(1)}A
          </span>
        </div>
      </div>

      {/* 24h chart */}
      <div className="card p-3 flex-1 flex flex-col" style={{ borderColor: '#ffd60a18' }}>
        <div className="mono text-[8px] text-[var(--color-muted)] tracking-[0.15em] uppercase mb-2">24H Energy Flow</div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={RECENT} margin={{ top: 2, right: 2, left: -30, bottom: 0 }}>
              <defs>
                {[['gs','#39ff14'],['gl','#ffd60a']].map(([id,c]) => (
                  <linearGradient key={id} id={`ep-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}   />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 7, fill: '#5a8a9f', fontFamily: 'JetBrains Mono' }} interval={8} />
              <YAxis tick={{ fontSize: 7, fill: '#5a8a9f', fontFamily: 'JetBrains Mono' }} />
              <Tooltip contentStyle={{ background: 'rgba(9,18,25,0.95)', border: '1px solid #132030', borderRadius: 8, fontSize: 10 }} />
              <Area type="monotone" dataKey="solar" name="Solar" stroke="#39ff14" fill="url(#ep-gs)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="load"  name="Load"  stroke="#ffd60a" fill="url(#ep-gl)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* System status legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
          {[
            { l: 'Solar',   c: '#39ff14' }, { l: 'Battery', c: '#00ffc8' },
            { l: 'Grid',    c: '#ffd60a' }, { l: 'Usage',   c: '#9b5de5' },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.c, boxShadow: `0 0 4px ${s.c}` }} />
              <span className="mono text-[8px] text-[var(--color-muted)]">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
