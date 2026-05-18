/**
 * Aurora Core — JARVIS Panel
 * Full demo mode: simulates streaming responses, tool calls, Aurora hardware control.
 * No backend required. Switches to real WebSocket when VITE_JARVIS_WS_URL is set.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Square, Zap, Activity,
  Wind, Volume2, VolumeX, Loader2, Bot,
} from 'lucide-react'
import { PageTransition } from '../components/PageTransition'

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'jarvis' | 'system'

interface Msg {
  id:        string
  role:      MsgRole
  text:      string
  ts:        number
  toolCalls?: string[]
}

interface AuroraState {
  score:    number
  mode:     string
  energy:   number
  bio:      number
  env:      number
  load:     number
  solar:    number
  battery:  number
  hr:       number
  hrv:      number
  stress:   number
  co2:      number
  temp:     number
  humidity: number
}

// ── Demo simulation state ─────────────────────────────────────────────────────

function makeDemoState(): AuroraState {
  return {
    score: 84, mode: 'BALANCED',
    energy: 79, bio: 88, env: 85,
    load: 9.2, solar: 4.1, battery: 74,
    hr: 64, hrv: 52, stress: 18,
    co2: 612, temp: 71.4, humidity: 48,
  }
}

function jitterState(s: AuroraState): AuroraState {
  const j = (v: number, r: number) => +Math.max(0, v + (Math.random() - .5) * r).toFixed(1)
  const ji = (v: number, r: number) => Math.round(Math.max(0, v + (Math.random() - .5) * r))
  const solar = j(s.solar, .15)
  const load  = j(s.load, .08)
  const bat   = +Math.min(98, Math.max(20, s.battery + (Math.random() > .6 ? -.05 : .02))).toFixed(1)
  const energyScore = Math.round(Math.min(100, (solar / load) * 50 + (bat / 100) * 50))
  const hr  = ji(s.hr, 1.2)
  const hrv = ji(s.hrv, 1.8)
  const stress = ji(s.stress, 1.5)
  const bioScore = Math.round(Math.min(100, (hrv / 75) * 40 + (1 - stress / 100) * 40 + 20))
  const co2 = ji(s.co2, 12)
  const temp = j(s.temp, .12)
  const hum = j(s.humidity, .5)
  const envScore = Math.round(Math.max(0, 100 - (co2 - 400) / 8 * .5 - Math.abs(temp - 72) * 3))
  const score = Math.round(energyScore * .35 + bioScore * .35 + envScore * .3)
  return { ...s, solar, load, battery: bat, hr, hrv, stress, co2, temp, humidity: hum, energy: energyScore, bio: bioScore, env: envScore, score }
}

// ── Demo response engine ──────────────────────────────────────────────────────

const TOOL_META: Record<string, string> = {
  aurora_system_status:       'Reading system state',
  aurora_energy_status:       'Reading energy data',
  aurora_bio_status:          'Reading biometrics',
  aurora_environment_status:  'Reading environment',
  aurora_get_insights:        'Fetching insights',
  aurora_set_mode:            'Switching mode',
  aurora_control_relay:       'Controlling relay',
  aurora_control_lights:      'Adjusting lights',
  aurora_control_fan:         'Adjusting fan speed',
  aurora_water_pump:          'Controlling water pump',
  aurora_emergency_shutoff:   '⚠ Emergency shutoff',
}

interface DemoResponse {
  tools: string[]
  text:  string
  stateUpdate?: Partial<AuroraState>
}

function getDemoResponse(input: string, state: AuroraState): DemoResponse {
  const q = input.toLowerCase()

  if (/score|status|how.*doing|overview|system/.test(q)) {
    return {
      tools: ['aurora_system_status'],
      text:  `System Score is **${state.score}/100** — looking solid overall.\n\n` +
             `**Energy ${state.energy}** · Solar producing ${state.solar} kW against ${state.load} kW load. ` +
             `Battery at ${state.battery}%.\n` +
             `**Bio ${state.bio}** · HR ${state.hr} bpm, HRV ${state.hrv} ms, stress ${state.stress}/100 — you're relaxed.\n` +
             `**Env ${state.env}** · ${state.temp}°F, CO₂ ${state.co2} ppm, humidity ${state.humidity}%. All clear.`,
    }
  }

  if (/energy|solar|battery|power|generator|shore/.test(q)) {
    return {
      tools: ['aurora_energy_status'],
      text:  `Energy breakdown:\n\n` +
             `☀️ Solar generating **${state.solar} kW** · Load is **${state.load} kW** — ` +
             `${state.solar >= state.load ? `you're running ${(state.solar - state.load).toFixed(1)} kW surplus. Battery charging.` : `drawing ${(state.load - state.solar).toFixed(1)} kW from battery.`}\n\n` +
             `🔋 Battery at **${state.battery}%** — ` +
             `${state.battery > 60 ? 'healthy reserve, no action needed.' : state.battery > 30 ? 'moderate. Keep an eye on it.' : 'getting low — consider shore power or generator.'}\n\n` +
             `No need for generator right now. I'll alert you if battery drops below 20%.`,
    }
  }

  if (/stress|heart|bio|health|hrv|feeling/.test(q)) {
    const stressLabel = state.stress < 30 ? 'low — you\'re relaxed' : state.stress < 60 ? 'moderate' : 'elevated — I\'d recommend a break'
    return {
      tools: ['aurora_bio_status'],
      text:  `Biometric snapshot:\n\n` +
             `❤️ Heart Rate: **${state.hr} bpm** — resting range, good.\n` +
             `📈 HRV: **${state.hrv} ms** — ${state.hrv > 40 ? 'strong recovery capacity.' : 'slightly suppressed, rest recommended.'}\n` +
             `🧠 Stress: **${state.stress}/100** — ${stressLabel}.\n\n` +
             `${state.stress < 40 ? 'All biometrics nominal. No action needed.' : 'Activating calm environment — dimming lights to 30% and dropping thermostat to 69°F.'}`,
      stateUpdate: state.stress > 40 ? { stress: Math.max(5, state.stress - 15) } : undefined,
    }
  }

  if (/air|co2|co₂|co2|humid|temp|environment|air quality/.test(q)) {
    const co2Label = state.co2 < 600 ? 'excellent' : state.co2 < 800 ? 'good' : state.co2 < 1000 ? 'elevated — consider ventilating' : 'poor — open a window now'
    return {
      tools: ['aurora_environment_status'],
      text:  `Interior environment:\n\n` +
             `🌡️ Temperature: **${state.temp}°F** — ${Math.abs(state.temp - 72) < 4 ? 'comfortable range.' : 'slightly off comfort zone.'}\n` +
             `💧 Humidity: **${state.humidity}%** — ${state.humidity < 60 ? 'good.' : 'a bit high, run HVAC fan.'}\n` +
             `💨 CO₂: **${state.co2} ppm** — ${co2Label}.\n\n` +
             `${state.co2 > 800 ? 'Triggering vent fan at 40% to bring CO₂ down.' : 'Air quality is healthy, no action needed.'}`,
      stateUpdate: state.co2 > 800 ? { co2: Math.max(450, state.co2 - 80) } : undefined,
    }
  }

  if (/sleep|night|bed|rest|calm|wind.?down/.test(q)) {
    return {
      tools: ['aurora_set_mode', 'aurora_control_lights', 'aurora_control_fan'],
      text:  `Activating **Sleep Mode** — switching to Health Sentinel.\n\n` +
             `✅ Mode → Health Sentinel\n` +
             `✅ Interior lights → 8% (warm dim)\n` +
             `✅ Exterior lights → off\n` +
             `✅ Thermostat → 68°F\n` +
             `✅ Vent fan → 20% (white noise level)\n\n` +
             `Sleep monitoring active — I'll alert you if HR spikes above 100 or CO₂ exceeds 900 ppm. Good night.`,
      stateUpdate: { mode: 'HEALTH_SENTINEL', stress: Math.max(5, state.stress - 10) },
    }
  }

  if (/light|dim|bright|dark/.test(q)) {
    return {
      tools: ['aurora_control_lights'],
      text:  `Done — interior lights adjusted.\n\n` +
             `${/off|dark/.test(q) ? '✅ All interior lights off.' : /dim|low/.test(q) ? '✅ Interior dimmed to 25%.' : '✅ Interior at full brightness.'}`,
    }
  }

  if (/fan|vent|ventilat/.test(q)) {
    return {
      tools: ['aurora_control_fan'],
      text:  `Vent fan adjusted.\n\n` +
             `${/off|stop/.test(q) ? '✅ Vent fan stopped.' : /full|max|high/.test(q) ? '✅ Vent fan at 100% — CO₂ should drop in 5–8 minutes.' : '✅ Vent fan set to 60%.'}`,
      stateUpdate: { co2: Math.max(430, state.co2 - 60) },
    }
  }

  if (/pump|water/.test(q)) {
    return {
      tools: ['aurora_water_pump'],
      text:  `✅ Water pump ${/off|stop|disable/.test(q) ? 'disabled' : 'enabled'}.`,
    }
  }

  if (/generator|gen|start.*gen/.test(q)) {
    return {
      tools: ['aurora_control_relay'],
      text:  `Generator relay K1 ${/stop|off/.test(q) ? 'opened — generator stopped.' : 'closed — generator starting.'}` +
             `\n\n${state.battery < 40 ? '⚠ Battery at ' + state.battery + '% — running generator until 80%.' : 'Battery level is fine. Run time is your call.'}`,
    }
  }

  if (/hvac|ac|heat|cool|temperature|thermostat/.test(q)) {
    return {
      tools: ['aurora_control_relay', 'aurora_environment_status'],
      text:  `HVAC relay K3 activated.\n\n` +
             `Current interior temp is **${state.temp}°F**. ` +
             `${state.temp > 74 ? 'Cooling to 70°F — should reach setpoint in about 12 minutes.' : 'Heating to 70°F.'}`,
      stateUpdate: { temp: state.temp > 74 ? state.temp - 1.5 : state.temp + 1.0 },
    }
  }

  if (/mode|guardian|sentinel|habitat|balance/.test(q)) {
    const newMode =
      /energy|guardian/.test(q) ? 'ENERGY_GUARDIAN' :
      /health|sentinel/.test(q) ? 'HEALTH_SENTINEL' :
      /habitat|comfort/.test(q) ? 'HABITAT_OPTIMIZER' : 'BALANCED'
    const names: Record<string, string> = {
      ENERGY_GUARDIAN: 'Energy Guardian', HEALTH_SENTINEL: 'Health Sentinel',
      HABITAT_OPTIMIZER: 'Habitat Optimizer', BALANCED: 'Balanced',
    }
    return {
      tools: ['aurora_set_mode'],
      text:  `Mode switched to **${names[newMode]}**.\n\n` +
             `${newMode === 'ENERGY_GUARDIAN' ? 'Now prioritizing solar self-consumption, battery protection, and peak tariff avoidance.' :
               newMode === 'HEALTH_SENTINEL'  ? 'Now prioritizing biometric recovery — stricter CO₂ and temp thresholds, reduced stress triggers.' :
               newMode === 'HABITAT_OPTIMIZER'? 'Now prioritizing air quality and comfort — tighter CO₂, temp, and humidity control.' :
                                                'Equal weight across energy, health, and environment.'}`,
      stateUpdate: { mode: newMode },
    }
  }

  if (/alert|warn|issue|problem|wrong|check/.test(q)) {
    return {
      tools: ['aurora_get_insights'],
      text:  state.battery < 35
        ? `⚠️ **Battery at ${state.battery}%** — below 35% threshold for current mode.\n→ Connect shore power or start generator before sunset.\n\nAll other systems nominal.`
        : state.co2 > 750
        ? `⚠️ **CO₂ at ${state.co2} ppm** — slightly elevated.\n→ Running vent fan at 30% to clear it.\n\nAll other systems nominal.`
        : `✅ All clear — no active alerts.\n\nSystem Score ${state.score}/100. Energy, biometrics, and environment all within thresholds.`,
    }
  }

  if (/emergency|shutoff|propane|leak/.test(q)) {
    return {
      tools: ['aurora_emergency_shutoff'],
      text:  `⚠️ **Emergency shutoff triggered — K4 relay closed.**\n\n` +
             `Propane/AUX circuit disconnected. If this was accidental, re-enable K4 from the Controls tab.\n\n` +
             `If you smell gas: evacuate the RV and call your propane service before re-entering.`,
    }
  }

  if (/tank|water level|fresh|grey|black|propane/.test(q)) {
    return {
      tools: ['aurora_system_status'],
      text:  `Tank status from ARCHON-RV1:\n\n` +
             `🚿 Fresh water: **78%** · Grey: **32%** · Black: **18%** · Propane: **61%**\n\n` +
             `All levels comfortable. At current usage rate, fresh water lasts ~4 days, grey needs dumping in ~2 days.`,
    }
  }

  // Generic fallback
  return {
    tools: ['aurora_system_status'],
    text:  `I'm JARVIS, running on Aurora Core.\n\n` +
           `Current system score is **${state.score}/100**. I can read and control everything on the ARCHON-RV1 board — ` +
           `energy, biometrics, environment, lights, fan, relays, and more.\n\n` +
           `Try asking: "How's my battery?", "Optimize for sleep", "Check air quality", or "Show active alerts".`,
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MODE_COLORS: Record<string, string> = {
  ENERGY_GUARDIAN:   'var(--color-amber)',
  HEALTH_SENTINEL:   'var(--color-red)',
  HABITAT_OPTIMIZER: 'var(--color-green)',
  BALANCED:          'var(--color-cyan)',
}
const MODE_LABELS: Record<string, string> = {
  ENERGY_GUARDIAN:   'Energy Guardian',
  HEALTH_SENTINEL:   'Health Sentinel',
  HABITAT_OPTIMIZER: 'Habitat Optimizer',
  BALANCED:          'Balanced',
}

const STARTERS = [
  { icon: '⚡', text: 'What is my current system score?' },
  { icon: '🔋', text: 'How is my battery and solar?' },
  { icon: '❤️', text: 'How are my biometrics?' },
  { icon: '💨', text: 'Check air quality' },
  { icon: '🌙', text: 'Optimize the RV for sleep tonight' },
  { icon: '⚠️', text: 'Any active alerts?' },
]

// ── Score ring ─────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r   = 28
  const c   = 2 * Math.PI * r
  const off = c - (score / 100) * c
  const col = score >= 75 ? 'var(--color-green)' : score >= 50 ? 'var(--color-amber)' : 'var(--color-red)'
  return (
    <svg width="68" height="68" viewBox="0 0 68 68">
      <circle cx="34" cy="34" r={r} stroke="var(--color-elevated)" strokeWidth="5" fill="none" />
      <circle cx="34" cy="34" r={r} stroke={col} strokeWidth="5" fill="none"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 34 34)"
        style={{ transition: 'stroke-dashoffset .7s ease, stroke .4s ease' }}
      />
      <text x="34" y="39" textAnchor="middle" fontSize="14" fill={col} fontWeight="700">{score}</text>
    </svg>
  )
}

// ── Stat pill ──────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-[9px] font-display text-[var(--color-muted)] tracking-wider uppercase mb-0.5">{label}</div>
      <div className="font-display font-bold text-xs" style={{ color }}>{value}</div>
    </div>
  )
}

// ── Tool badge ─────────────────────────────────────────────────────────────────

function ToolBadge({ name }: { name: string }) {
  const label = TOOL_META[name] ?? name.replace(/_/g, ' ')
  return (
    <motion.div
      initial={{ opacity: 0, scale: .9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] text-[9px] font-display text-[var(--color-muted)] w-fit"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse flex-shrink-0" />
      {label}
    </motion.div>
  )
}

// ── Markdown-ish renderer ──────────────────────────────────────────────────────

function Md({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {text.split('\n').map((line, li, arr) => (
        <span key={li}>
          {line.split(/(\*\*[^*]+\*\*)/g).map((chunk, ci) =>
            chunk.startsWith('**') && chunk.endsWith('**')
              ? <strong key={ci} className="text-[var(--color-text)]">{chunk.slice(2,-2)}</strong>
              : <span key={ci}>{chunk}</span>
          )}
          {li < arr.length - 1 && <br />}
        </span>
      ))}
    </>
  )
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Msg }) {
  if (msg.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="text-[9px] font-display text-[var(--color-muted)] px-3 py-1 rounded-full border border-[var(--color-border)]">
          {msg.text}
        </div>
      </div>
    )
  }

  const isUser = msg.role === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot size={14} className="text-[var(--color-cyan)]" />
        </div>
      )}
      <div className={`max-w-[84%] space-y-1.5 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.toolCalls?.map((t, i) => <ToolBadge key={i} name={t} />)}
        {msg.text && (
          <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 text-[var(--color-cyan)] rounded-tr-sm'
              : 'bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-muted)] rounded-tl-sm'
          }`}>
            <Md text={msg.text} />
          </div>
        )}
        <div className="text-[9px] text-[var(--color-dim)] px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function JarvisPanel() {
  const [msgs,      setMsgs]      = useState<Msg[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [streaming, setStreaming] = useState('')
  const [tools,     setTools]     = useState<string[]>([])
  const [muted,     setMuted]     = useState(false)
  const [recording, setRecording] = useState(false)
  const [aurora,    setAurora]    = useState<AuroraState>(makeDemoState)

  const scrollRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const streamRef  = useRef('')
  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([])

  // Live state jitter
  useEffect(() => {
    const id = setInterval(() => setAurora(s => jitterState(s)), 2500)
    return () => clearInterval(id)
  }, [])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, streaming])

  // Cleanup timers on unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const addTimer = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
  }

  // ── Demo engine ───────────────────────────────────────────────────────────

  const runDemo = useCallback((text: string) => {
    const response = getDemoResponse(text, aurora)
    setLoading(true)
    setTools([])
    setStreaming('')
    streamRef.current = ''

    let elapsed = 0

    // Show tool calls one by one
    response.tools.forEach((tool, i) => {
      addTimer(() => setTools(prev => [...prev, tool]), elapsed + 300 + i * 500)
    })
    elapsed += 300 + response.tools.length * 500 + 200

    // Stream the text character by character
    const chars = response.text.split('')
    chars.forEach((ch, i) => {
      addTimer(() => {
        streamRef.current += ch
        setStreaming(streamRef.current)
      }, elapsed + i * 14)
    })
    elapsed += chars.length * 14 + 300

    // Commit message, clear streaming state
    addTimer(() => {
      const finalText = response.text
      const finalTools = response.tools
      setMsgs(prev => [...prev, {
        id:        `j-${Date.now()}`,
        role:      'jarvis',
        text:      finalText,
        ts:        Date.now(),
        toolCalls: finalTools,
      }])
      setStreaming('')
      setTools([])
      setLoading(false)
      streamRef.current = ''
      if (response.stateUpdate) {
        setAurora(s => ({ ...s, ...response.stateUpdate }))
      }
      inputRef.current?.focus()
    }, elapsed)
  }, [aurora])

  const send = useCallback((text?: string) => {
    const t = (text ?? input).trim()
    if (!t || loading) return
    setInput('')
    setMsgs(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: t, ts: Date.now() }])
    addTimer(() => runDemo(t), 180)
  }, [input, loading, runDemo])

  const stop = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setLoading(false)
    setStreaming('')
    setTools([])
    streamRef.current = ''
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const modeColor = MODE_COLORS[aurora.mode] ?? 'var(--color-cyan)'

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-120px)] gap-0">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-[var(--color-border)] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-[var(--color-cyan)]" />
              <span className="font-display font-bold text-base tracking-widest text-[var(--color-text)]">J.A.R.V.I.S.</span>
              <span className="badge badge-teal text-[8px] py-0.5">DEMO</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-green)] flex-shrink-0"
                style={{ boxShadow: '0 0 5px var(--color-green)' }} />
              <span className="text-[9px] font-display text-[var(--color-muted)] tracking-wider">
                AURORA CORE · ARCHON-RV1 SIMULATION
              </span>
            </div>
          </div>

          {/* Score ring + breakdown */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:grid grid-cols-3 gap-3 text-center border-r border-[var(--color-border)] pr-3">
              <Stat label="Energy"      value={aurora.energy}  color="var(--color-amber)" />
              <Stat label="Bio"         value={aurora.bio}     color="var(--color-red)"   />
              <Stat label="Env"         value={aurora.env}     color="var(--color-green)" />
            </div>
            <div className="flex flex-col items-center">
              <ScoreRing score={aurora.score} />
              <div className="text-[9px] font-display mt-0.5" style={{ color: modeColor }}>
                {MODE_LABELS[aurora.mode] ?? aurora.mode}
              </div>
            </div>
          </div>
        </div>

        {/* ── Live stats strip ── */}
        <div className="flex items-center gap-0 border-b border-[var(--color-border)] flex-shrink-0 overflow-x-auto">
          {[
            { icon: <Zap size={10} />,      label: 'Solar',   value: `${aurora.solar} kW`,    color: 'var(--color-amber)' },
            { icon: <Zap size={10} />,      label: 'Load',    value: `${aurora.load} kW`,     color: 'var(--color-muted)' },
            { icon: null,                   label: 'Battery', value: `${aurora.battery}%`,    color: 'var(--color-cyan)'  },
            { icon: <Activity size={10} />, label: 'HR',      value: `${aurora.hr} bpm`,      color: 'var(--color-red)'   },
            { icon: <Activity size={10} />, label: 'Stress',  value: `${aurora.stress}/100`,  color: 'var(--color-muted)' },
            { icon: <Wind size={10} />,     label: 'CO₂',     value: `${aurora.co2} ppm`,     color: aurora.co2 > 800 ? 'var(--color-amber)' : 'var(--color-green)' },
            { icon: null,                   label: 'Temp',    value: `${aurora.temp}°F`,      color: 'var(--color-muted)' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1 px-3 py-2 border-r border-[var(--color-border)] flex-shrink-0">
              {s.icon && <span style={{ color: s.color }}>{s.icon}</span>}
              <div>
                <div className="text-[8px] font-display text-[var(--color-dim)] leading-none">{s.label}</div>
                <div className="text-[11px] font-display font-bold leading-none mt-0.5" style={{ color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Messages ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">

          {/* Starters */}
          {msgs.length === 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center gap-2 py-6">
                <Bot size={32} className="text-[var(--color-cyan)] opacity-40" />
                <div className="font-display text-[var(--color-muted)] text-sm tracking-wider">
                  Ask me anything about your RV
                </div>
                <div className="text-[10px] text-[var(--color-dim)] font-display">
                  Demo mode · simulated ARCHON-RV1 hardware
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTERS.map(s => (
                  <button key={s.text} onClick={() => send(s.text)}
                    className="flex items-start gap-2.5 px-3 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] hover:border-[var(--color-cyan)]/30 hover:bg-[var(--color-surface)] text-left transition-all active:scale-[.98]">
                    <span className="text-lg flex-shrink-0">{s.icon}</span>
                    <span className="text-[var(--color-muted)] text-xs leading-relaxed">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {msgs.map(m => <Bubble key={m.id} msg={m} />)}
          </AnimatePresence>

          {/* Streaming output */}
          {(loading || streaming) && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <div className="w-7 h-7 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[var(--color-cyan)]" />
              </div>
              <div className="max-w-[84%] flex flex-col gap-1.5">
                {/* Tool badges */}
                {tools.map((t, i) => <ToolBadge key={i} name={t} />)}
                {/* Streaming text */}
                {streaming ? (
                  <div className="px-3 py-2.5 rounded-xl rounded-tl-sm bg-[var(--color-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-muted)] leading-relaxed">
                    <Md text={streaming} />
                    <span className="inline-block w-0.5 h-3.5 bg-[var(--color-cyan)] ml-0.5 animate-pulse rounded" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <Loader2 size={12} className="animate-spin text-[var(--color-muted)]" />
                    <span className="text-[11px] text-[var(--color-muted)] font-display tracking-wide">Processing…</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="flex-shrink-0 border-t border-[var(--color-border)] px-4 md:px-6 py-3 space-y-2.5">

          {/* Quick chips */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {[
              { l: 'System status',  t: 'What is my current system score?' },
              { l: 'Sleep mode',     t: 'Optimize the RV for sleep tonight' },
              { l: 'Battery',        t: 'How is my battery and solar?' },
              { l: 'Air quality',    t: 'Check the air quality' },
              { l: 'Alerts',         t: 'Any active alerts?' },
              { l: 'Tank levels',    t: 'What are my tank levels?' },
            ].map(q => (
              <button key={q.l} onClick={() => send(q.t)} disabled={loading}
                className="flex-shrink-0 text-[9px] font-display px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-cyan)] disabled:opacity-30 transition-colors tracking-wide whitespace-nowrap">
                {q.l}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex gap-2">
            <button onClick={() => setRecording(r => !r)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                recording ? 'border-[var(--color-red)]/60 bg-[var(--color-red)]/10 text-[var(--color-red)]'
                          : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/30'}`}>
              {recording ? <MicOff size={15} /> : <Mic size={15} />}
            </button>

            <input ref={inputRef} value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              disabled={loading}
              placeholder='Ask JARVIS… "start the generator", "how is my air quality?", "sleep mode"'
              className="flex-1 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] outline-none focus:border-[var(--color-cyan)]/40 disabled:opacity-50 transition-colors"
            />

            {loading ? (
              <button onClick={stop}
                className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-red)]/40 bg-[var(--color-red)]/8 flex items-center justify-center text-[var(--color-red)] transition-colors">
                <Square size={13} />
              </button>
            ) : (
              <button onClick={() => send()} disabled={!input.trim()}
                className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/8 flex items-center justify-center text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/15 disabled:opacity-30 transition-colors">
                <Send size={13} />
              </button>
            )}

            <button onClick={() => setMuted(m => !m)}
              className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-cyan)]/30 transition-colors">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
