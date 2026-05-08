import { useEffect, useRef } from 'react'
import type { LiveMetrics } from '../types'

type Agent = { name: string; color: string; x: number; y: number; icon: string; subs: string[] }

const AGENTS: Agent[] = [
  { name: 'HEALTH',      color: '#ff3366', x: 0.5,  y: 0.08, icon: '♥', subs: ['Vital Signs','HRV Analysis','Anomaly Detection','Predictive Care'] },
  { name: 'ENERGY',      color: '#ffd60a', x: 0.92, y: 0.5,  icon: '⚡', subs: ['Optimization','Usage Forecasting','Resource Balancing','Efficiency Learning'] },
  { name: 'ENVIRONMENT', color: '#39ff14', x: 0.5,  y: 0.92, icon: '🌿', subs: ['Context Awareness','Ambient Monitoring','Predictive Adaptation','Sustainability'] },
  { name: 'BEHAVIOR',    color: '#9b5de5', x: 0.08, y: 0.5,  icon: '◈', subs: ['Pattern Recognition','Habit Modeling','Intent Analysis','Adaptive Learning'] },
]

export function NeuralCore({ metrics }: { metrics: LiveMetrics }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef  = useRef<number>(0)
  const timeRef   = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      canvas.width  = rect.width
      canvas.height = rect.height
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      timeRef.current += 0.012
      const t = timeRef.current
      const W = canvas.width, H = canvas.height
      const cx = W / 2, cy = H / 2
      const R = Math.min(W, H) * 0.36

      ctx.clearRect(0, 0, W, H)

      // ── Agent positions
      const positions = AGENTS.map(a => ({
        ...a,
        px: a.x * W,
        py: a.y * H,
      }))

      // ── Neural link paths between agents and center
      positions.forEach((a, i) => {
        const wobble = Math.sin(t * 1.2 + i * 1.5) * 8
        const ctrl1x = cx + (a.px - cx) * 0.4 + wobble
        const ctrl1y = cy + (a.py - cy) * 0.4 - wobble
        const ctrl2x = cx + (a.px - cx) * 0.7 - wobble
        const ctrl2y = cy + (a.py - cy) * 0.7 + wobble

        // Main neural link
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.bezierCurveTo(ctrl1x, ctrl1y, ctrl2x, ctrl2y, a.px, a.py)
        const grad = ctx.createLinearGradient(cx, cy, a.px, a.py)
        grad.addColorStop(0, '#00ffc830')
        grad.addColorStop(0.5, a.color + '40')
        grad.addColorStop(1, a.color + '60')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Secondary filaments
        for (let f = 0; f < 3; f++) {
          const off = (f - 1) * 12
          ctx.beginPath()
          ctx.moveTo(cx + off, cy)
          ctx.bezierCurveTo(
            ctrl1x + off, ctrl1y + off * 0.5,
            ctrl2x - off * 0.5, ctrl2y,
            a.px, a.py
          )
          ctx.strokeStyle = a.color + '15'
          ctx.lineWidth = 0.5
          ctx.stroke()
        }

        // Traveling pulses
        const pulseCount = 3
        for (let p = 0; p < pulseCount; p++) {
          const progress = ((t * 0.4 + p / pulseCount + i * 0.25) % 1)
          const pt = getPtOnBezier(
            { x: cx, y: cy }, { x: ctrl1x, y: ctrl1y },
            { x: ctrl2x, y: ctrl2y }, { x: a.px, y: a.py },
            progress
          )
          const size = 2.5 + Math.sin(t * 3 + p) * 0.8
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, size, 0, Math.PI * 2)
          ctx.fillStyle = a.color
          ctx.shadowBlur = 10
          ctx.shadowColor = a.color
          ctx.fill()
          ctx.shadowBlur = 0
        }
      })

      // ── Cross-agent connections
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i], b = positions[j]
          ctx.beginPath()
          ctx.moveTo(a.px, a.py)
          ctx.lineTo(b.px, b.py)
          ctx.strokeStyle = `rgba(0,255,200,0.04)`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // ── Central neural core
      const coreR = Math.min(W, H) * 0.1
      const pulse = 1 + Math.sin(t * 2) * 0.06

      // Outer glow rings
      for (let ring = 4; ring >= 1; ring--) {
        const ringR = coreR * pulse * (1 + ring * 0.35)
        const alpha = 0.08 / ring
        ctx.beginPath()
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,255,200,${alpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // Core gradient fill
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * pulse)
      coreGrad.addColorStop(0, '#00ffc850')
      coreGrad.addColorStop(0.4, '#00ffc820')
      coreGrad.addColorStop(0.7, '#9b5de515')
      coreGrad.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * pulse, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // Core border
      ctx.beginPath()
      ctx.arc(cx, cy, coreR * pulse, 0, Math.PI * 2)
      ctx.strokeStyle = '#00ffc870'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 20
      ctx.shadowColor = '#00ffc8'
      ctx.stroke()
      ctx.shadowBlur = 0

      // Rotating inner hexagram
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(t * 0.3)
      const hex = coreR * 0.5
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3
        i === 0 ? ctx.moveTo(Math.cos(a) * hex, Math.sin(a) * hex) : ctx.lineTo(Math.cos(a) * hex, Math.sin(a) * hex)
      }
      ctx.closePath()
      ctx.strokeStyle = '#00ffc840'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.restore()

      // AC text in center
      ctx.font = `bold ${coreR * 0.55}px Syne`
      ctx.fillStyle = '#00ffc8'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowBlur = 12
      ctx.shadowColor = '#00ffc8'
      ctx.fillText('AC', cx, cy - 2)
      ctx.shadowBlur = 0

      ctx.font = `500 ${coreR * 0.2}px JetBrains Mono`
      ctx.fillStyle = '#5a8a9f'
      ctx.fillText('NEURAL CORE', cx, cy + coreR * 0.45)

      // ── Agent orbs
      positions.forEach((a, i) => {
        const orbR = Math.min(W, H) * 0.085
        const orPulse = 1 + Math.sin(t * 1.5 + i) * 0.04

        // Glow
        const orbGrad = ctx.createRadialGradient(a.px, a.py, 0, a.px, a.py, orbR * orPulse * 1.5)
        orbGrad.addColorStop(0, a.color + '35')
        orbGrad.addColorStop(0.5, a.color + '18')
        orbGrad.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(a.px, a.py, orbR * orPulse * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = orbGrad
        ctx.fill()

        // Orb border
        ctx.beginPath()
        ctx.arc(a.px, a.py, orbR * orPulse, 0, Math.PI * 2)
        ctx.strokeStyle = a.color + '80'
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 16
        ctx.shadowColor = a.color
        ctx.stroke()
        ctx.shadowBlur = 0

        // Rotating ring
        ctx.save()
        ctx.translate(a.px, a.py)
        ctx.rotate(t * (i % 2 === 0 ? 0.4 : -0.3))
        ctx.beginPath()
        ctx.arc(0, 0, orbR * 0.75, 0, Math.PI * 1.6)
        ctx.strokeStyle = a.color + '40'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.restore()

        // Agent name
        ctx.font = `700 ${Math.min(W,H) * 0.022}px Syne`
        ctx.fillStyle = a.color
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowBlur = 8
        ctx.shadowColor = a.color
        ctx.fillText(a.name, a.px, a.py)
        ctx.shadowBlur = 0

        // Icon
        ctx.font = `${orbR * 0.35}px serif`
        ctx.fillText(a.icon, a.px, a.py - orbR * 0.45)
      })

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Corner stats */}
      <div className="absolute top-3 left-3 space-y-1">
        {[
          { l: 'CORE STATUS',        v: 'STABLE',    c: '#39ff14' },
          { l: 'LATTICE INTEGRITY',  v: '98.7%',     c: '#00ffc8' },
          { l: 'SYNC',               v: '99.91%',    c: '#00ffc8' },
          { l: 'CORE TEMP',          v: `${metrics.temp.toFixed(1)}°F`, c: '#ffd60a' },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-1.5">
            <span className="mono text-[8px] text-[var(--color-dim)] tracking-wider">{s.l}</span>
            <span className="mono text-[8px] font-bold" style={{ color: s.c }}>{s.v}</span>
          </div>
        ))}
      </div>
      <div className="absolute top-3 right-3 space-y-1 text-right">
        {[
          { l: 'DATA STREAM',  v: 'ACTIVE',      c: '#39ff14' },
          { l: 'THROUGHPUT',   v: '1.24 TB/s',   c: '#00ffc8' },
          { l: 'LATENCY',      v: '2.7 ms',      c: '#00ffc8' },
          { l: 'PACKET LOSS',  v: '0.00%',       c: '#39ff14' },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-1.5 justify-end">
            <span className="mono text-[8px] font-bold" style={{ color: s.c }}>{s.v}</span>
            <span className="mono text-[8px] text-[var(--color-dim)] tracking-wider">{s.l}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 space-y-1">
        {[
          { l: 'NEURAL LINK MAP', v: '' },
          { l: 'LINKS ACTIVE',    v: '12,846',   c: '#00ffc8' },
          { l: 'LINK STRENGTH',   v: `${metrics.systemScore}.3%`, c: '#9b5de5' },
          { l: 'SIGNAL QUALITY',  v: 'EXCELLENT', c: '#39ff14' },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-1.5">
            <span className="mono text-[8px] text-[var(--color-dim)] tracking-wider">{s.l}</span>
            {s.v && <span className="mono text-[8px] font-bold" style={{ color: s.c ?? '#fff' }}>{s.v}</span>}
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 space-y-1 text-right">
        {[
          { l: 'ADAPTIVE LEARNING', v: '' },
          { l: 'MODEL VERSION',     v: 'v7.3.2',    c: '#00ffc8' },
          { l: 'LEARNING RATE',     v: '0.0017',    c: '#ffd60a' },
          { l: 'CONFIDENCE',        v: '98.62%',    c: '#39ff14' },
        ].map(s => (
          <div key={s.l} className="flex items-center gap-1.5 justify-end">
            {s.v && <span className="mono text-[8px] font-bold" style={{ color: s.c ?? '#fff' }}>{s.v}</span>}
            <span className="mono text-[8px] text-[var(--color-dim)] tracking-wider">{s.l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getPtOnBezier(
  p0: { x: number; y: number }, p1: { x: number; y: number },
  p2: { x: number; y: number }, p3: { x: number; y: number },
  t: number
) {
  const mt = 1 - t
  return {
    x: mt ** 3 * p0.x + 3 * mt ** 2 * t * p1.x + 3 * mt * t ** 2 * p2.x + t ** 3 * p3.x,
    y: mt ** 3 * p0.y + 3 * mt ** 2 * t * p1.y + 3 * mt * t ** 2 * p2.y + t ** 3 * p3.y,
  }
}
