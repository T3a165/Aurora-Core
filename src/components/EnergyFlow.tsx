import { motion } from 'framer-motion'
import type { LiveMetrics } from '../lib/useRealtime'

type Props = { metrics: LiveMetrics }

function FlowNode({
  x, y, label, sublabel, icon, color, active = true,
}: {
  x: number; y: number; label: string; sublabel: string
  icon: string; color: string; active?: boolean
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-36} y={-28} width={72} height={56} rx={8}
        fill={active ? `${color}18` : 'oklch(0.14 0.032 240)'}
        stroke={active ? color : 'oklch(0.20 0.040 240)'}
        strokeWidth={active ? 1.5 : 1}
      />
      {active && (
        <rect x={-36} y={-28} width={72} height={56} rx={8}
          fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      )}
      <text x={0} y={-6} textAnchor="middle" fontSize={18}>{icon}</text>
      <text x={0} y={10} textAnchor="middle" fontSize={9}
        fill={active ? 'oklch(0.92 0.015 240)' : 'oklch(0.58 0.040 240)'}
        fontFamily="Exo 2" fontWeight="600">{label}</text>
      <text x={0} y={22} textAnchor="middle" fontSize={8}
        fill={active ? color : 'oklch(0.35 0.040 240)'}
        fontFamily="Share Tech Mono">{sublabel}</text>
    </g>
  )
}

function FlowArrow({
  x1, y1, x2, y2, value, active, color, reverse = false,
}: {
  x1: number; y1: number; x2: number; y2: number
  value: string; active: boolean; color: string; reverse?: boolean
}) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const pathId = `path-${x1}-${y1}-${x2}-${y2}`
  const d = `M ${x1} ${y1} L ${x2} ${y2}`

  return (
    <g>
      <path id={pathId} d={d} fill="none" stroke={active ? color : 'oklch(0.20 0.040 240)'} strokeWidth={active ? 2 : 1} strokeDasharray={active ? 'none' : '4 4'} />

      {active && (
        <>
          {/* Glow */}
          <path d={d} fill="none" stroke={color} strokeWidth={4} opacity={0.15} />
          {/* Animated dot */}
          <motion.circle
            r={3} fill={color}
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            initial={reverse ? { offsetDistance: '100%' } : { offsetDistance: '0%' }}
            animate={reverse ? { offsetDistance: '0%' } : { offsetDistance: '100%' }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          >
            <animateMotion dur="1.8s" repeatCount="indefinite" keyPoints={reverse ? '1;0' : '0;1'} keyTimes="0;1" calcMode="linear">
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </motion.circle>
        </>
      )}

      {/* Label */}
      <rect x={mx - 20} y={my - 9} width={40} height={14} rx={4} fill="oklch(0.08 0.025 240)" />
      <text x={mx} y={my + 1.5} textAnchor="middle" fontSize={8}
        fill={active ? color : 'oklch(0.35 0.040 240)'}
        fontFamily="Share Tech Mono" fontWeight="bold">{value}</text>
    </g>
  )
}

export function EnergyFlow({ metrics }: Props) {
  const { solar, load, grid, batterySoc, batteryCurrent } = metrics
  const isCharging = batteryCurrent > 0
  const isExporting = grid < 0

  return (
    <div className="card p-4">
      <div className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-[var(--color-muted)] mb-3">Live Power Flow</div>
      <div className="w-full" style={{ aspectRatio: '2.2 / 1', minHeight: 160 }}>
        <svg viewBox="0 0 440 200" className="w-full h-full" style={{ overflow: 'visible' }}>

          {/* Solar → Home */}
          <FlowArrow x1={82} y1={100} x2={178} y2={100}
            value={`${solar} kW`} active={solar > 0.1}
            color="var(--color-green)" />

          {/* Home → Grid */}
          <FlowArrow x1={262} y1={100} x2={358} y2={100}
            value={`${grid.toFixed(2)} kW`} active={grid > 0.05}
            color="var(--color-cyan)" reverse={isExporting} />

          {/* Home ↔ Battery */}
          <FlowArrow x1={220} y1={72} x2={220} y2={30}
            value={`${Math.abs(batteryCurrent).toFixed(1)}A`}
            active={Math.abs(batteryCurrent) > 0.5}
            color={isCharging ? 'var(--color-green)' : 'var(--color-amber)'}
            reverse={isCharging} />

          {/* Nodes */}
          <FlowNode x={46}  y={100} icon="☀️" label="Solar"   sublabel={`${solar} kW`}    color="var(--color-green)"  active={solar > 0.1} />
          <FlowNode x={220} y={100} icon="🏠" label="Home"    sublabel={`${load} kW`}     color="var(--color-cyan)"   active />
          <FlowNode x={394} y={100} icon="⚡" label="Grid"    sublabel={`${grid.toFixed(2)} kW`} color="var(--color-blue)"  active={grid > 0.05} />
          <FlowNode x={220} y={24}  icon="🔋" label="Battery" sublabel={`${batterySoc}%`} color="var(--color-amber)"  active />

          {/* Charge/discharge indicator */}
          <text x={244} y={60} fontSize={7} fill={isCharging ? 'var(--color-green)' : 'var(--color-amber)'}
            fontFamily="Exo 2">{isCharging ? '▲ CHG' : '▼ DCH'}</text>
        </svg>
      </div>
    </div>
  )
}
