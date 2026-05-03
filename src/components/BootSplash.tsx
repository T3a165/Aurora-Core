import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BOOT_SEQ = [
  { ms: 400,  text: 'Initializing Aurora Core v2.0…',          type: 'sys'  },
  { ms: 800,  text: 'L1 Bio Ingestion……………… [OK]',            type: 'ok'   },
  { ms: 1100, text: 'L2 Signal Normalization…… [OK]',          type: 'ok'   },
  { ms: 1350, text: 'L3 Cognitive Core (4 agents)… [OK]',      type: 'ok'   },
  { ms: 1570, text: 'L4 Predictive Simulation……… [OK]',        type: 'ok'   },
  { ms: 1760, text: 'L5 Decision Orchestration…… [OK]',        type: 'ok'   },
  { ms: 1930, text: 'L6 TurnBot Execution Layer… [OK]',        type: 'ok'   },
  { ms: 2080, text: 'L7 Optimization Loop……………… [OK]',         type: 'ok'   },
  { ms: 2280, text: 'Linking Claude AI inference…',            type: 'sys'  },
  { ms: 2500, text: '▸ All 7 layers operational.',             type: 'done' },
]

export function BootSplash({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<typeof BOOT_SEQ[0][]>([])
  const [phase, setPhase] = useState<'boot' | 'logo' | 'dedication'>('boot')

  useEffect(() => {
    BOOT_SEQ.forEach(item => {
      setTimeout(() => setLines(prev => [...prev, item]), item.ms)
    })
    setTimeout(() => setPhase('logo'),       2700)
    setTimeout(() => setPhase('dedication'), 3400)
    setTimeout(onDone,                       4600)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Aurora orbs */}
      <div className="aurora-orb-1" style={{ opacity: 0.5 }} />
      <div className="aurora-orb-2" style={{ opacity: 0.4 }} />
      <div className="aurora-orb-3" style={{ opacity: 0.3 }} />
      <div className="grid-overlay absolute inset-0" />

      <AnimatePresence mode="wait">

        {/* Phase 1 — boot log */}
        {phase === 'boot' && (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-sm px-6 z-10"
          >
            {/* Logo small */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <div className="w-8 h-8 rounded-lg border border-[oklch(0.82_0.16_196_/_0.4)] bg-[oklch(0.82_0.16_196_/_0.08)] flex items-center justify-center">
                <span className="text-[var(--color-cyan)] font-display font-black text-xs">AC</span>
              </div>
              <div>
                <div className="font-display font-black text-xs text-[var(--color-cyan)] text-glow-cyan tracking-widest">AURORA CORE</div>
                <div className="font-display text-[9px] text-[var(--color-dim)] tracking-[0.2em]">v2.0 · McLain Systems</div>
              </div>
            </motion.div>

            {/* Boot log terminal */}
            <div className="card p-4 font-mono">
              <div className="space-y-1.5 min-h-[180px]">
                <AnimatePresence>
                  {lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`text-[10px] leading-relaxed font-mono ${
                        line.type === 'done' ? 'text-[var(--color-green)]' :
                        line.type === 'ok'   ? 'text-[var(--color-muted)]' :
                                               'text-[var(--color-cyan)]'
                      }`}
                    >
                      {line.type === 'ok' && <span className="text-[var(--color-green)] mr-2">✓</span>}
                      {line.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {phase === 'boot' && lines.length < BOOT_SEQ.length && (
                  <span className="text-[var(--color-cyan)] text-[10px] blink">▋</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 2 — big logo */}
        {phase === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-4 z-10"
          >
            <div className="w-20 h-20 rounded-2xl border-2 border-[oklch(0.82_0.16_196_/_0.5)] bg-[oklch(0.82_0.16_196_/_0.08)] flex items-center justify-center glow-cyan">
              <span className="font-display font-black text-3xl gradient-text-aurora">AC</span>
            </div>
            <div className="text-center">
              <div className="font-display font-black text-4xl gradient-text-aurora tracking-wider">AURORA CORE</div>
              <div className="font-display text-xs text-[var(--color-muted)] tracking-[0.3em] uppercase mt-1">Cognitive-Energy Ecosystem</div>
            </div>
          </motion.div>
        )}

        {/* Phase 3 — dedication */}
        {phase === 'dedication' && (
          <motion.div
            key="dedication"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-5 z-10 text-center px-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
              className="text-5xl"
            >
              💙
            </motion.div>
            <div>
              <div className="font-display font-black text-2xl text-[var(--color-text)] mb-2">
                For <span className="gradient-text-legacy">Zachary Lee McLain</span>
              </div>
              <div className="font-display text-xs text-[var(--color-muted)] leading-relaxed max-w-xs">
                Born April 13, 2026 · Galveston, Texas<br />
                Every line of code. Every impossible problem.<br />
                Every night you wouldn't sleep without a reason.
              </div>
            </div>
            <div className="mono text-[9px] text-[var(--color-dim)] tracking-[0.25em] uppercase">
              Jonas Lee · Darrell Lee · Garrett Lee · Zachary Lee
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
