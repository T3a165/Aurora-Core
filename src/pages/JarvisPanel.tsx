/**
 * Aurora Core — JARVIS Panel
 * Voice + chat interface powered by J.A.R.V.I.S. (TimLukaHorstmann/J.A.R.V.I.S.)
 * Integrated with Aurora Core decision engine and ARCHON-RV1 hardware
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, MicOff, Send, Square, Zap, Activity,
  Thermometer, Wind, Battery, Volume2, VolumeX,
  AlertTriangle, CheckCircle2, Loader2, Cpu,
} from 'lucide-react'
import { PageTransition } from '../components/PageTransition'

// ── Types ─────────────────────────────────────────────────────────────────────

type MsgRole = 'user' | 'jarvis' | 'system'

interface Msg {
  id:       string
  role:     MsgRole
  text:     string
  ts:       number
  thinking?: string
  toolCalls?: Array<{ tool: string; args: Record<string, unknown> }>
}

interface AuroraSnap {
  score:   number
  mode:    string
  energy:  number
  bio:     number
  env:     number
}

// ── Config ────────────────────────────────────────────────────────────────────

const JARVIS_WS_URL = import.meta.env.VITE_JARVIS_WS_URL ?? 'ws://localhost:8080/ws'

const STARTERS = [
  { icon: '⚡', text: 'What is my current system score and energy status?' },
  { icon: '🔋', text: 'Battery is low — should I start the generator or connect shore power?' },
  { icon: '❤️', text: 'How is my stress level and what should I do about it?' },
  { icon: '💨', text: 'CO₂ is elevated in the RV — what should I do?' },
  { icon: '🌙', text: 'Optimize the RV for sleep tonight' },
  { icon: '⚠️', text: 'Are there any active alerts I should know about?' },
]

const MODE_LABELS: Record<string, string> = {
  ENERGY_GUARDIAN:   'Energy Guardian',
  HEALTH_SENTINEL:   'Health Sentinel',
  HABITAT_OPTIMIZER: 'Habitat Optimizer',
  BALANCED:          'Balanced',
}

const MODE_COLORS: Record<string, string> = {
  ENERGY_GUARDIAN:   'var(--color-amber)',
  HEALTH_SENTINEL:   'var(--color-red)',
  HABITAT_OPTIMIZER: 'var(--color-green)',
  BALANCED:          'var(--color-cyan)',
}

// ── Score Ring ────────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r    = 26
  const circ = 2 * Math.PI * r
  const off  = circ - (score / 100) * circ
  const col  = score >= 75 ? 'var(--color-green)' : score >= 50 ? 'var(--color-amber)' : 'var(--color-red)'
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r={r} stroke="var(--color-elevated)" strokeWidth="5" fill="none" />
      <circle
        cx="32" cy="32" r={r}
        stroke={col} strokeWidth="5" fill="none"
        strokeDasharray={circ} strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
        style={{ transition: 'stroke-dashoffset .6s ease, stroke .4s ease' }}
      />
      <text x="32" y="37" textAnchor="middle" fontSize="13" fill={col} fontWeight="700">
        {score}
      </text>
    </svg>
  )
}

// ── Tool Call Badge ───────────────────────────────────────────────────────────

const TOOL_META: Record<string, { icon: typeof Zap; label: string }> = {
  aurora_system_status:      { icon: Activity,    label: 'Reading system state'    },
  aurora_energy_status:      { icon: Zap,         label: 'Reading energy'          },
  aurora_bio_status:         { icon: Activity,    label: 'Reading biometrics'      },
  aurora_environment_status: { icon: Wind,        label: 'Reading environment'     },
  aurora_get_insights:       { icon: AlertTriangle, label: 'Fetching insights'    },
  aurora_set_mode:           { icon: Cpu,         label: 'Switching mode'          },
  aurora_control_relay:      { icon: Zap,         label: 'Controlling relay'       },
  aurora_control_lights:     { icon: Zap,         label: 'Adjusting lights'        },
  aurora_control_fan:        { icon: Wind,        label: 'Adjusting fan'           },
  aurora_water_pump:         { icon: Thermometer, label: 'Controlling water pump'  },
  aurora_emergency_shutoff:  { icon: AlertTriangle, label: '⚠ Emergency shutoff'  },
}

function ToolBadge({ tool }: { tool: string }) {
  const meta = TOOL_META[tool] ?? { icon: Zap, label: tool.replace(/_/g, ' ') }
  const Icon = meta.icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] text-[10px] font-display text-[var(--color-muted)] w-fit"
    >
      <Icon size={11} className="text-[var(--color-cyan)]" />
      {meta.label}
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber)] animate-pulse" />
    </motion.div>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Msg }) {
  const isUser   = msg.role === 'user'
  const isSystem = msg.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="text-[10px] font-display text-[var(--color-muted)] px-3 py-1 rounded-full border border-[var(--color-border)]">
          {msg.text}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs">🤖</span>
        </div>
      )}

      <div className={`max-w-[82%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Tool calls */}
        {msg.toolCalls?.map((tc, i) => (
          <ToolBadge key={i} tool={tc.tool} />
        ))}

        {/* Thinking */}
        {msg.thinking && (
          <div className="text-[10px] text-[var(--color-muted)] italic border-l-2 border-[var(--color-border)] pl-2">
            {msg.thinking.slice(0, 120)}{msg.thinking.length > 120 ? '…' : ''}
          </div>
        )}

        {/* Text */}
        {msg.text && (
          <div className={`px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/20 text-[var(--color-cyan)] rounded-tr-sm'
              : 'bg-[var(--color-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-tl-sm'
          }`}>
            {msg.text}
          </div>
        )}

        <div className="text-[9px] text-[var(--color-dim)] px-1">
          {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function JarvisPanel() {
  const [msgs,      setMsgs]      = useState<Msg[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [aurora,    setAurora]    = useState<AuroraSnap | null>(null)
  const [wsStatus,  setWsStatus]  = useState<'connecting' | 'live' | 'offline'>('connecting')
  const [recording, setRecording] = useState(false)
  const [muted,     setMuted]     = useState(false)
  const [thinking,  setThinking]  = useState('')
  const [streaming, setStreaming] = useState('')

  const wsRef       = useRef<WebSocket | null>(null)
  const sessionRef  = useRef<string>('')
  const scrollRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const retryRef    = useRef<ReturnType<typeof setTimeout>>()
  const retryCount  = useRef(0)

  // ── Aurora score polling (from Aurora Core API) ──────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL ?? ''
        const apiKey = import.meta.env.VITE_API_KEY ?? ''
        if (!apiUrl || !apiKey) return
        const r = await fetch(`${apiUrl}/v1/state`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!r.ok) return
        const d = await r.json()
        setAurora({
          score:  d.scores?.system  ?? 0,
          mode:   d.mode?.id        ?? 'BALANCED',
          energy: d.scores?.energy  ?? 0,
          bio:    d.scores?.bio     ?? 0,
          env:    d.scores?.env     ?? 0,
        })
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [])

  // ── WebSocket to JARVIS backend ───────────────────────────────────────────
  const connectWS = useCallback(() => {
    setWsStatus('connecting')
    const ws = new WebSocket(JARVIS_WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      retryCount.current = 0
      setWsStatus('live')
      setMsgs([{
        id:   'boot',
        role: 'system',
        text: 'JARVIS connected — Aurora Core integration active',
        ts:   Date.now(),
      }])
    }

    ws.onmessage = (ev) => {
      try {
        const d = JSON.parse(ev.data as string)

        if (d.type === 'session_init') {
          sessionRef.current = d.session_id
          return
        }

        if (d.type === 'thought') {
          setThinking(prev => prev + (d.chunk ?? ''))
          return
        }

        if (d.type === 'text') {
          setStreaming(prev => prev + (d.chunk ?? ''))
          return
        }

        if (d.type === 'tool_call') {
          setMsgs(prev => {
            const last = prev[prev.length - 1]
            if (last?.role === 'jarvis' && !last.text) {
              return [
                ...prev.slice(0, -1),
                { ...last, toolCalls: [...(last.toolCalls ?? []), { tool: d.tool, args: d.args }] },
              ]
            }
            return [...prev, {
              id:       `tc-${Date.now()}`,
              role:     'jarvis',
              text:     '',
              ts:       Date.now(),
              toolCalls: [{ tool: d.tool, args: d.args }],
            }]
          })
          return
        }

        if (d.type === 'complete') {
          setLoading(false)
          setMsgs(prev => {
            const text = streaming
            const thk  = thinking
            setStreaming('')
            setThinking('')
            if (!text) return prev
            return [...prev, { id: `j-${Date.now()}`, role: 'jarvis', text, ts: Date.now(), thinking: thk || undefined }]
          })
          return
        }

        if (d.type === 'error') {
          setLoading(false)
          setMsgs(prev => [...prev, {
            id:   `err-${Date.now()}`,
            role: 'system',
            text: `Error: ${d.message}`,
            ts:   Date.now(),
          }])
        }
      } catch { /* ignore */ }
    }

    ws.onclose = () => {
      setWsStatus('offline')
      const delay = Math.min(1000 * 2 ** retryCount.current, 15000)
      retryCount.current++
      retryRef.current = setTimeout(connectWS, delay)
    }

    ws.onerror = () => ws.close()
  }, [streaming, thinking])

  useEffect(() => {
    connectWS()
    return () => {
      wsRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, []) // eslint-disable-line

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, streaming])

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback((text?: string) => {
    const t = (text ?? input).trim()
    if (!t || loading || wsRef.current?.readyState !== WebSocket.OPEN) return
    setInput('')
    setLoading(true)
    setThinking('')
    setStreaming('')
    setMsgs(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', text: t, ts: Date.now() }])
    wsRef.current!.send(JSON.stringify({ type: 'text', text: t, thinking: true }))
    inputRef.current?.focus()
  }, [input, loading])

  const stop = () => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }))
    setLoading(false)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const statusColor = {
    live:       'var(--color-green)',
    connecting: 'var(--color-amber)',
    offline:    'var(--color-red)',
  }[wsStatus]

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-120px)] gap-3 p-4 md:p-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-[var(--color-text)] tracking-wider">J.A.R.V.I.S.</span>
              <span className="text-[10px] font-display text-[var(--color-muted)] tracking-widest">AURORA CORE</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
              <span className="text-[10px] text-[var(--color-muted)] font-display tracking-wider uppercase">
                {wsStatus === 'live' ? 'Online' : wsStatus === 'connecting' ? 'Connecting…' : 'Offline — retrying'}
              </span>
            </div>
          </div>

          {/* Aurora score */}
          {aurora && (
            <div className="flex items-center gap-3">
              <ScoreRing score={aurora.score} />
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-display text-[var(--color-muted)] tracking-wider">SYSTEM SCORE</div>
                <div
                  className="text-[10px] font-display tracking-wider mt-0.5"
                  style={{ color: MODE_COLORS[aurora.mode] ?? 'var(--color-cyan)' }}
                >
                  {MODE_LABELS[aurora.mode] ?? aurora.mode}
                </div>
                <div className="flex gap-2 mt-1 text-[9px] font-display text-[var(--color-muted)]">
                  <span><Zap size={8} className="inline" style={{ color: 'var(--color-amber)' }} /> {aurora.energy}</span>
                  <span><Activity size={8} className="inline" style={{ color: 'var(--color-red)' }} /> {aurora.bio}</span>
                  <span><Wind size={8} className="inline" style={{ color: 'var(--color-green)' }} /> {aurora.env}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Message thread ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-3 pr-1"
        >
          {/* Starters */}
          {msgs.length === 0 && wsStatus === 'live' && (
            <div className="space-y-3 pt-2">
              <div className="text-center text-[var(--color-muted)] text-sm font-display tracking-wider py-4">
                How can I help with your RV today?
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTERS.map(s => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] hover:border-[var(--color-cyan)]/30 text-left transition-colors text-sm"
                  >
                    <span className="text-base flex-shrink-0">{s.icon}</span>
                    <span className="text-[var(--color-muted)] text-xs leading-relaxed">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {msgs.map(m => <Bubble key={m.id} msg={m} />)}
          </AnimatePresence>

          {/* Streaming response */}
          {(loading || streaming) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">🤖</span>
              </div>
              <div className="max-w-[82%] flex flex-col gap-1.5">
                {streaming ? (
                  <div className="px-3 py-2.5 rounded-xl rounded-tl-sm bg-[var(--color-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] leading-relaxed">
                    {streaming}
                    <span className="inline-block w-1.5 h-3.5 bg-[var(--color-cyan)] ml-0.5 animate-pulse rounded-sm" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <Loader2 size={13} className="animate-spin text-[var(--color-muted)]" />
                    <span className="text-xs text-[var(--color-muted)]">
                      {thinking ? 'Thinking…' : 'Processing…'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Input bar ── */}
        <div className="flex-shrink-0 space-y-2">

          {/* Quick actions */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { label: 'System status',    text: 'What is my current system score?' },
              { label: 'Sleep mode',       text: 'Optimize the RV for sleep tonight' },
              { label: 'Energy check',     text: 'How is my energy and battery?' },
              { label: 'Air quality',      text: 'Check the air quality' },
              { label: 'Any alerts?',      text: 'Are there any active alerts?' },
            ].map(q => (
              <button
                key={q.label}
                onClick={() => send(q.text)}
                disabled={loading || wsStatus !== 'live'}
                className="flex-shrink-0 text-[10px] font-display px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-cyan)] transition-colors disabled:opacity-30 tracking-wide"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div className="flex gap-2">
            {/* Mic (placeholder — wires to JARVIS WebSocket audio when mic permission granted) */}
            <button
              onClick={() => setRecording(r => !r)}
              className={`flex-shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                recording
                  ? 'border-[var(--color-red)] bg-[var(--color-red)]/10 text-[var(--color-red)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-cyan)]/40'
              }`}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder='Ask JARVIS about your RV… ("start the generator", "how is air quality?")'
              disabled={loading || wsStatus !== 'live'}
              className="flex-1 bg-[var(--color-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] outline-none focus:border-[var(--color-cyan)]/40 disabled:opacity-40 transition-colors"
            />

            {loading ? (
              <button
                onClick={stop}
                className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-red)]/40 bg-[var(--color-red)]/8 flex items-center justify-center text-[var(--color-red)] hover:bg-[var(--color-red)]/15 transition-colors"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                onClick={() => send()}
                disabled={!input.trim() || wsStatus !== 'live'}
                className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/8 flex items-center justify-center text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/15 disabled:opacity-30 transition-colors"
              >
                <Send size={14} />
              </button>
            )}

            <button
              onClick={() => setMuted(m => !m)}
              className="flex-shrink-0 w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-cyan)]/30 transition-colors"
              title={muted ? 'Unmute voice' : 'Mute voice'}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
