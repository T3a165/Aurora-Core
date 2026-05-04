import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard, Layers, Brain, Zap, Battery, FlaskConical,
  Radio, MessageSquare, Bell, ChevronLeft, ChevronRight,
  Activity, Menu, X, Heart, BookOpen, ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import { AuroraBackground } from './AuroraBackground'
import { DataTicker } from './DataTicker'
import { useRealtime } from '../lib/useRealtime'

const NAV = [
  { path: '/',             icon: LayoutDashboard, label: 'Dashboard'   },
  { path: '/layers',       icon: Layers,          label: 'Layers'      },
  { path: '/agents',       icon: Brain,           label: 'Agents'      },
  { path: '/circuits',     icon: Zap,             label: 'Circuits'    },
  { path: '/battery',      icon: Battery,         label: 'Battery'     },
  { path: '/simulation',   icon: FlaskConical,    label: 'Simulation'  },
  { path: '/turnbot',      icon: Radio,           label: 'TurnBot'     },
  { path: '/chat',         icon: MessageSquare,   label: 'AI Chat'     },
  { path: '/alerts',       icon: Bell,            label: 'Alerts'      },
  { path: '/integrations',  icon: ExternalLink,    label: 'Integrations', divider: true },
  { path: '/manifesto',    icon: BookOpen,        label: 'Manifesto'   },
  { path: '/legacy',       icon: Heart,           label: 'Legacy'      },
]

const BOTTOM_PRIMARY = ['/', '/chat', '/integrations', '/legacy', '/manifesto']

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const metrics = useRealtime()

  const isActive = (path: string) =>
    location === path || (path !== '/' && location.startsWith(path))

  const navItemClass = (path: string) => clsx(
    'flex items-center gap-3 px-2.5 py-2 rounded-lg font-medium transition-all duration-150 cursor-pointer',
    isActive(path)
      ? path === '/legacy' || path === '/manifesto'
        ? 'bg-[oklch(0.85_0.20_0_/_0.12)] text-[oklch(0.90_0.18_0)] border border-[oklch(0.85_0.20_0_/_0.35)]'
        : 'bg-[oklch(0.82_0.16_196_/_0.12)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.35)]'
      : path === '/legacy' || path === '/manifesto'
        ? 'text-[oklch(0.65_0.14_0)] hover:text-[oklch(0.85_0.20_0)] hover:bg-[oklch(0.85_0.20_0_/_0.07)]'
        : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]',
  )

  return (
    <div className="flex h-screen overflow-hidden relative">
      <AuroraBackground />

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className={clsx(
        'hidden md:flex flex-col flex-shrink-0 transition-all duration-300 relative z-10',
        'bg-[var(--color-surface)]/80 backdrop-blur-xl border-r border-[var(--color-border)]',
        collapsed ? 'w-[52px]' : 'w-52',
      )}>
        {/* Wordmark */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-[var(--color-border)]">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[oklch(0.82_0.16_196_/_0.10)] border border-[oklch(0.82_0.16_196_/_0.35)] flex items-center justify-center glow-cyan">
            <Activity className="w-4 h-4 text-[var(--color-cyan)]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-display font-black text-sm text-[var(--color-cyan)] text-glow-cyan leading-tight tracking-wider">AURORA</div>
              <div className="font-display text-[9px] text-[var(--color-dim)] tracking-[0.2em] uppercase leading-tight">CORE · McLain Systems</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-1.5">
          {NAV.map(({ path, icon: Icon, label, divider }) => (
            <div key={path}>
              {divider && <div className="h-px bg-[var(--color-border)] my-2 mx-2" />}
              <Link href={path}>
                <a className={navItemClass(path)}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!collapsed && <span className="truncate font-display text-xs tracking-wide">{label}</span>}
                </a>
              </Link>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ── Desktop main ─────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col flex-1 min-w-0 relative z-10">
        <DataTicker metrics={metrics} />
        <main className="flex-1 overflow-y-auto grid-overlay">
          {children}
        </main>
      </div>

      {/* ── Mobile shell ─────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 md:hidden relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[oklch(0.82_0.16_196_/_0.10)] border border-[oklch(0.82_0.16_196_/_0.35)] flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
            </div>
            <div>
              <span className="font-display font-black text-sm text-[var(--color-cyan)] text-glow-cyan tracking-wider">AURORA CORE</span>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg text-[var(--color-muted)] active:bg-[var(--color-elevated)]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Live ticker */}
        <DataTicker metrics={metrics} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto grid-overlay pb-20">
          {children}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-border)] md:hidden">
          <div className="flex items-stretch h-14" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {BOTTOM_PRIMARY.map(path => {
              const item = NAV.find(n => n.path === path)!
              const Icon = item.icon
              const active = isActive(path)
              const isSpecial = path === '/legacy' || path === '/manifesto'
              return (
                <Link key={path} href={path}>
                  <a onClick={() => setDrawerOpen(false)}
                    className={clsx(
                      'flex-1 flex flex-col items-center justify-center gap-0.5 px-1 transition-all active:scale-95',
                      active
                        ? isSpecial ? 'text-[oklch(0.90_0.18_0)]' : 'text-[var(--color-cyan)]'
                        : isSpecial ? 'text-[oklch(0.55_0.12_0)]' : 'text-[var(--color-muted)]',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[8px] font-display tracking-wide">{item.label}</span>
                  </a>
                </Link>
              )
            })}
            <button onClick={() => setDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[var(--color-muted)] active:scale-95">
              <Menu className="w-5 h-5" />
              <span className="text-[8px] font-display tracking-wide">More</span>
            </button>
          </div>
        </nav>

        {/* Slide drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--color-surface)]/95 backdrop-blur-xl border-l border-[var(--color-border)] flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)]">
                <div>
                  <div className="font-display font-black text-sm text-[var(--color-cyan)] text-glow-cyan tracking-widest">AURORA CORE</div>
                  <div className="mono text-[8px] text-[var(--color-dim)]">McLain Systems · v2.0</div>
                </div>
                <button onClick={() => setDrawerOpen(false)} className="p-1 text-[var(--color-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {NAV.map(({ path, icon: Icon, label, divider }) => (
                  <div key={path}>
                    {divider && <div className="h-px bg-[var(--color-border)] my-2 mx-1" />}
                    <Link href={path}>
                      <a onClick={() => setDrawerOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-3 rounded-lg transition-all active:scale-[0.98]',
                          isActive(path)
                            ? path === '/legacy' || path === '/manifesto'
                              ? 'bg-[oklch(0.85_0.20_0_/_0.12)] text-[oklch(0.90_0.18_0)] border border-[oklch(0.85_0.20_0_/_0.35)]'
                              : 'bg-[oklch(0.82_0.16_196_/_0.12)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.3)]'
                            : path === '/legacy' || path === '/manifesto'
                              ? 'text-[oklch(0.65_0.14_0)] hover:bg-[oklch(0.85_0.20_0_/_0.07)]'
                              : 'text-[var(--color-muted)] hover:bg-[var(--color-elevated)]',
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-display text-sm font-medium">{label}</span>
                      </a>
                    </Link>
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Shared UI ────────────────────────────────────────────────────── */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-[var(--color-border)]">
      <div>
        <h1 className="font-display font-bold text-lg md:text-xl text-[var(--color-text)] tracking-wide">{title}</h1>
        {subtitle && <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-display tracking-wide">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, unit, delta, color = 'var(--color-cyan)' }: {
  label: string; value: string | number; unit?: string; delta?: string; color?: string
}) {
  return (
    <div className="card card-glow p-3 md:p-4">
      <div className="text-[9px] font-display tracking-[0.12em] uppercase text-[var(--color-muted)] mb-1.5">{label}</div>
      <div className="flex items-end gap-1">
        <span className="mono text-xl md:text-2xl font-bold" style={{ color }}>{value}</span>
        {unit && <span className="text-[10px] text-[var(--color-muted)] mb-0.5">{unit}</span>}
      </div>
      {delta && <div className="text-[9px] text-[var(--color-muted)] mt-1">{delta}</div>}
    </div>
  )
}

export function StatusDot({ status }: { status: 'active' | 'idle' | 'conflict' | 'off' | 'error' }) {
  const colors: Record<string, string> = {
    active: 'var(--color-green)', idle: 'var(--color-muted)',
    conflict: 'var(--color-amber)', off: 'var(--color-dim)', error: 'var(--color-red)',
  }
  return <span className="status-dot pulse-dot flex-shrink-0" style={{ backgroundColor: colors[status] ?? colors.idle }} />
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3 md:mb-4">
      <span className="text-[10px] font-display font-bold tracking-[0.15em] uppercase text-[var(--color-muted)]">{children}</span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}
