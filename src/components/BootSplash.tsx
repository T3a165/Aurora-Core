import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity } from 'lucide-react'

const BOOT_LINES = [
  { text: 'Initializing Aurora Core v2.0…',         delay: 300  },
  { text: 'Loading cognitive layer stack (L1–L7)…',  delay: 700  },
  { text: 'Connecting AI agent consensus bus…',      delay: 1100 },
  { text: 'Calibrating biometric signal pipeline…',  delay: 1450 },
  { text: 'Linking TurnBot mesh network…',           delay: 1750 },
  { text: 'Activating predictive simulation…',       delay: 2000 },
  { text: '▸ All systems nominal.',                  delay: 2350 },
]

export function BootSplash({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    BOOT_LINES.forEach(({ text, delay }) => {
      setTimeout(() => setLines(prev => [...prev, text]), delay)
    })
    setTimeout(() => setReady(true), 2700)
    setTimeout(onDone, 3400)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col items-center justify-center gap-8 grid-overlay"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="flex flex-col items-center gap-3"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-elevated)] flex items-center justify-center glow-cyan border border-[oklch(0.82_0.16_196_/_0.3)]">
          <Activity className="w-8 h-8 text-[var(--color-cyan)]" style={{ filter: 'drop-shadow(0 0 8px var(--color-cyan))' }} />
        </div>
        <div className="text-center">
          <div className="font-display font-black text-3xl text-[var(--color-cyan)] text-glow-cyan tracking-widest">AURORA CORE</div>
          <div className="font-display text-xs text-[var(--color-muted)] tracking-[0.3em] uppercase mt-1">Cognitive-Energy Ecosystem · v2.0</div>
        </div>
      </motion.div>

      {/* Boot log */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm px-6"
      >
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 min-h-[140px]">
          <div className="space-y-1.5">
            <AnimatePresence>
              {lines.map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mono text-[10px] leading-relaxed ${
                    line.startsWith('▸') ? 'text-[var(--color-green)]' : 'text-[var(--color-muted)]'
                  }`}
                >
                  {line}
                </motion.div>
              ))}
            </AnimatePresence>
            {!ready && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="mono text-[10px] text-[var(--color-cyan)]"
              >▋</motion.span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Dedication */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ duration: 0.6 }}
        className="font-display text-[10px] text-[var(--color-dim)] tracking-[0.2em] uppercase text-center"
      >
        Built with purpose · For Zachary
      </motion.div>
    </motion.div>
  )
}
