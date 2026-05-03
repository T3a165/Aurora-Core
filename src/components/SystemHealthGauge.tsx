import { motion } from 'framer-motion'
import type { LiveMetrics } from '../lib/useRealtime'

function scoreColor(s: number) {
  if (s >= 85) return 'var(--color-green)'
  if (s >= 65) return 'var(--color-cyan)'
  if (s >= 45) return 'var(--color-amber)'
  return 'var(--color-red)'
}

function scoreLabel(s: number) {
  if (s >= 90) return 'OPTIMAL'
  if (s >= 75) return 'NOMINAL'
  if (s >= 55) return 'DEGRADED'
  return 'CRITICAL'
}

export function SystemHealthGauge({ metrics }: { metrics: LiveMetrics }) {
  const { systemScore, heartRate, hrv, batterySoc, solar, co2, stress } = metrics
  const color = scoreColor(systemScore)
  const label = scoreLabel(systemScore)

  const size = 160
  const r = 60
  const sweep = 240
  const start = 150
  const circ = 2 * Math.PI * r
  const arc = circ * (sweep / 360)
  const fill = arc * (systemScore / 100)

  const sub = [
    { l: 'Biometric', v: Math.round((hrv / 60) * 40 + (1 - stress / 100) * 60), color: '#ef4444' },
    { l: 'Energy',    v: Math.round((batterySoc / 100) * 50 + (solar / 5) * 50),  color: '#f59e0b' },
    { l: 'Environ',   v: Math.round(Math.max(0, 100 - (co2 - 400) / 3)),           color: '#10b981' },
  ]

  return (
    <div className="card aurora-gradient p-5 flex flex-col items-center gap-4">
      <div className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-[var(--color-muted)]">System Health Score</div>

      {/* Gauge */}
      <div className="relative" style={{ width: size, height: size * 0.75 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="var(--color-red)"   />
              <stop offset="50%"  stopColor="var(--color-amber)" />
              <stop offset="100%" stopColor="var(--color-green)" />
            </linearGradient>
          </defs>
          {/* Track */}
          {(() => {
            const polarToCart = (deg: number) => {
              const rad = ((deg - 90) * Math.PI) / 180
              return { x: size/2 + r * Math.cos(rad), y: size/2 + r * Math.sin(rad) }
            }
            const s = polarToCart(start)
            const e = polarToCart(start + sweep)
            return (
              <>
                <path
                  d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`}
                  fill="none" stroke="var(--color-elevated)" strokeWidth={10} strokeLinecap="round"
                />
                <path
                  d={`M ${s.x} ${s.y} A ${r} ${r} 0 1 1 ${e.x} ${e.y}`}
                  fill="none" stroke="url(#scoreGrad)" strokeWidth={10} strokeLinecap="round"
                  strokeDasharray={`${fill} ${arc}`}
                  style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: 'stroke-dasharray 0.8s ease' }}
                />
              </>
            )
          })()}
          {/* Score */}
          <text x={size/2} y={size/2 + 8} textAnchor="middle" fontSize={36}
            fontFamily="Share Tech Mono" fontWeight="bold" fill={color}
            style={{ transition: 'fill 0.5s' }}>{systemScore}</text>
          <text x={size/2} y={size/2 + 26} textAnchor="middle" fontSize={10}
            fontFamily="Exo 2" fontWeight="700" fill={color} letterSpacing="3"
            style={{ transition: 'fill 0.5s' }}>{label}</text>
        </svg>
      </div>

      {/* Sub-scores */}
      <div className="w-full grid grid-cols-3 gap-2">
        {sub.map(s => (
          <div key={s.l} className="flex flex-col items-center gap-1">
            <div className="text-[8px] font-display uppercase text-[var(--color-muted)] tracking-wider">{s.l}</div>
            <div className="w-full h-1.5 rounded-full bg-[var(--color-elevated)]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
                animate={{ width: `${s.v}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <div className="mono text-xs font-bold" style={{ color: s.color }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Live biometrics */}
      <div className="w-full grid grid-cols-2 gap-2">
        {[
          { l: 'Heart Rate', v: `${heartRate}`, u: 'bpm', color: '#ef4444' },
          { l: 'HRV',        v: `${hrv}`,       u: 'ms',  color: '#8b5cf6' },
        ].map(m => (
          <div key={m.l} className="bg-[var(--color-elevated)] rounded-lg p-2.5 text-center">
            <div className="text-[9px] font-display uppercase text-[var(--color-muted)]">{m.l}</div>
            <div className="mono text-lg font-bold" style={{ color: m.color }}>{m.v} <span className="text-[9px] font-normal text-[var(--color-muted)]">{m.u}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
