import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard, Layers, Brain, Zap, Battery,
  FlaskConical, Radio, MessageSquare, Bell, ChevronLeft, ChevronRight,
  Activity,
} from 'lucide-react'
import clsx from 'clsx'

const NAV = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard'         },
  { path: '/layers',       icon: Layers,          label: 'Cognitive Layers'  },
  { path: '/agents',       icon: Brain,           label: 'Agent Panel'       },
  { path: '/circuits',     icon: Zap,             label: 'Circuit Monitor'   },
  { path: '/battery',      icon: Battery,         label: 'Battery'           },
  { path: '/simulation',   icon: FlaskConical,    label: 'Simulation'        },
  { path: '/turnbot',      icon: Radio,           label: 'TurnBot'           },
  { path: '/chat',         icon: MessageSquare,   label: 'AI Chat'           },
  { path: '/alerts',       icon: Bell,            label: 'Alerts'            },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={clsx(
          'flex flex-col flex-shrink-0 transition-all duration-300',
          'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
          collapsed ? 'w-14' : 'w-52',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-[var(--color-border)]">
          <div className="flex-shrink-0 w-8 h-8 rounded bg-[var(--color-elevated)] flex items-center justify-center glow-cyan">
            <Activity className="w-4 h-4 text-[var(--color-cyan)]" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-display font-bold text-sm text-[var(--color-cyan)] text-glow-cyan leading-tight">AURORA</div>
              <div className="font-display text-[10px] text-[var(--color-muted)] tracking-[0.15em] uppercase leading-tight">CORE</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-1.5">
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = location === path || (path !== '/' && location.startsWith(path))
            return (
              <Link key={path} href={path}>
                <a
                  className={clsx(
                    'flex items-center gap-3 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer',
                    active
                      ? 'bg-[oklch(0.82_0.16_196_/_0.12)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.3)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]',
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate font-display text-xs tracking-wide">{label}</span>}
                </a>
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center p-2 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] grid-overlay">
        {children}
      </main>
    </div>
  )
}

// ─── Shared components ─────────────────────────────────────────────────────
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-6 pt-6 pb-4 border-b border-[var(--color-border)]">
      <h1 className="font-display font-bold text-xl text-[var(--color-text)] tracking-wide">{title}</h1>
      {subtitle && <p className="text-xs text-[var(--color-muted)] mt-0.5 font-display tracking-wide">{subtitle}</p>}
    </div>
  )
}

export function MetricCard({
  label, value, unit, delta, color = 'var(--color-cyan)',
}: {
  label: string; value: string | number; unit?: string; delta?: string; color?: string
}) {
  return (
    <div className="card card-glow p-4">
      <div className="text-[10px] font-display tracking-[0.12em] uppercase text-[var(--color-muted)] mb-2">{label}</div>
      <div className="flex items-end gap-1.5">
        <span className="mono text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-xs text-[var(--color-muted)] mb-0.5">{unit}</span>}
      </div>
      {delta && <div className="text-[10px] text-[var(--color-muted)] mt-1">{delta}</div>}
    </div>
  )
}

export function StatusDot({ status }: { status: 'active' | 'idle' | 'conflict' | 'off' | 'error' }) {
  const colors: Record<string, string> = {
    active:   'var(--color-green)',
    idle:     'var(--color-muted)',
    conflict: 'var(--color-amber)',
    off:      'var(--color-dim)',
    error:    'var(--color-red)',
  }
  return (
    <span
      className="status-dot pulse-dot flex-shrink-0"
      style={{ backgroundColor: colors[status] ?? colors.idle }}
    />
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-[var(--color-muted)]">{children}</span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}
