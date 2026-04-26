import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/Layout'

type Message = { role: 'user' | 'assistant'; content: string }

const STARTERS = [
  "What's the best dispatch mode for tonight given my HRV trends?",
  'Summarize the energy savings from peak shave today.',
  'Is my CO₂ level a concern? What should I do?',
  'Explain the L3 agent conflict and how it was resolved.',
  'How can I optimize battery cycles to extend lifespan?',
]

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemContext: `You are Aurora Core's integrated AI assistant — a concise, expert system for a 7-layer cognitive-energy platform. You have access to live system context:

System status: Battery SoC 74%, Solar 3.42 kW, Load 9.17 kW, 4 AI agents active (1 conflict: Energy vs Behavior at 18:00), CO₂ 612 ppm, HRV stress index LOW, TurnBot network online.

Answer questions about energy management, biometrics, device control, and system optimization. Be direct, specific, and technically precise. Keep answers under 150 words unless depth is needed.`,
          messages: next,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const text = data.content?.find((b: { type: string }) => b.type === 'text')?.text
        ?? 'No response received.'
      setMessages([...next, { role: 'assistant', content: text }])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg.includes('ANTHROPIC_API_KEY') || msg.includes('401')
        ? 'API key not configured. Add ANTHROPIC_API_KEY in your Vercel environment variables.'
        : `Request failed: ${msg}`)
      setMessages(next) // remove user msg on error? keep it
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setMessages([]); setError(null) }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="AI Chat"
        subtitle="Aurora Core intelligence · Powered by Claude"
      />

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-10">
            <div className="w-14 h-14 rounded-2xl aurora-gradient flex items-center justify-center border border-[var(--color-borderhi)]">
              <Sparkles className="w-6 h-6 text-[var(--color-cyan)]" />
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-base text-[var(--color-text)] mb-1">Aurora Core Intelligence</div>
              <div className="text-xs text-[var(--color-muted)] max-w-sm">Ask anything about your energy system, biometrics, device control, or optimization strategy.</div>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-md">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="card text-left px-3 py-2.5 hover:border-[var(--color-cyan)] text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-all font-display"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md aurora-gradient flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 border border-[var(--color-borderhi)]">
                <Sparkles className="w-3 h-3 text-[var(--color-cyan)]" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[oklch(0.82_0.16_196_/_0.12)] border border-[oklch(0.82_0.16_196_/_0.25)] text-[var(--color-text)] rounded-br-sm'
                  : 'card text-[var(--color-text)] rounded-tl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-md aurora-gradient flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 border border-[var(--color-borderhi)]">
              <Sparkles className="w-3 h-3 text-[var(--color-cyan)]" />
            </div>
            <div className="card px-4 py-3 rounded-xl rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-cyan)]" />
              <span className="text-xs text-[var(--color-muted)] font-display">Thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="card border-[var(--color-amber)] bg-[oklch(0.80_0.17_72_/_0.05)] px-4 py-3 rounded-xl text-xs text-[var(--color-amber)] font-display">
            ⚠ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="flex items-end gap-2">
          {messages.length > 0 && (
            <button
              onClick={reset}
              className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
              title="Clear chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1 flex items-end gap-2 card px-3 py-2">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Ask Aurora Core anything…"
              className="flex-1 bg-transparent outline-none resize-none text-sm text-[var(--color-text)] placeholder:text-[var(--color-dim)] font-sans leading-relaxed"
              style={{ maxHeight: 120 }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="p-1.5 rounded-md transition-all disabled:opacity-40"
              style={{ backgroundColor: 'oklch(0.82 0.16 196 / 0.15)', color: 'var(--color-cyan)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="text-[9px] text-[var(--color-dim)] text-center mt-1.5 font-display">Shift+Enter for new line · Enter to send</div>
      </div>
    </div>
  )
}
