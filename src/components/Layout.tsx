import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import {
  LayoutDashboard, Layers, Brain, Zap, Battery,
  FlaskConical, Radio, MessageSquare, Bell, ChevronLeft, ChevronRight,
  Activity, Menu, X, Heart,
} from 'lucide-react'
import clsx from 'clsx'

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
  { path: '/legacy',       icon: Heart,           label: 'Legacy'      },
]

const BOTTOM_PRIMARY = ['/', '/chat', '/agents', '/circuits', '/legacy']

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (path: string) =>
    location === path || (path !== '/' && location.startsWith(path))

  return (
    <div className="flex h-screen overflow-hidden">

      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden md:flex flex-col flex-shrink-0 transition-all duration-300',
        'bg-[var(--color-surface)] border-r border-[var(--color-border)]',
        collapsed ? 'w-14' : 'w-52',
      )}>
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

        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-1.5">
          {NAV.map(({ path, icon: Icon, label }) => (
            <Link key={path} href={path}>
              <a className={clsx(
                'flex items-center gap-3 px-2.5 py-2 rounded-md font-medium transition-all cursor-pointer',
                path === '/legacy' ? 'mt-2 border-t border-[var(--color-border)] pt-3' : '',
                isActive(path)
                  ? 'bg-[oklch(0.82_0.16_196_/_0.12)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.3)]'
                  : path === '/legacy'
                    ? 'text-[oklch(0.70_0.20_0)] hover:text-[oklch(0.85_0.20_0)] hover:bg-[oklch(0.70_0.20_0_/_0.08)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]',
              )}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate font-display text-xs tracking-wide">{label}</span>}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-full flex items-center justify-center p-2 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)] transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Desktop main */}
      <main className="hidden md:block flex-1 overflow-y-auto bg-[var(--color-bg)] grid-overlay">
        {children}
      </main>

      {/* Mobile shell */}
      <div className="flex flex-col flex-1 min-w-0 md:hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[var(--color-elevated)] flex items-center justify-center glow-cyan">
              <Activity className="w-3.5 h-3.5 text-[var(--color-cyan)]" />
            </div>
            <span className="font-display font-bold text-sm text-[var(--color-cyan)] text-glow-cyan tracking-wider">AURORA CORE</span>
          </div>
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-md text-[var(--color-muted)] active:bg-[var(--color-elevated)]">
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] grid-overlay pb-20">
          {children}
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-md border-t border-[var(--color-border)] md:hidden">
          <div className="flex items-stretch h-14" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {BOTTOM_PRIMARY.map(path => {
              const item = NAV.find(n => n.path === path)!
              const Icon = item.icon
              const active = isActive(path)
              const isLegacy = path === '/legacy'
              return (
                <Link key={path} href={path}>
                  <a
                    onClick={() => setDrawerOpen(false)}
                    className={clsx(
                      'flex-1 flex flex-col items-center justify-center gap-0.5 px-1 transition-all active:scale-95',
                      active
                        ? isLegacy ? 'text-[oklch(0.85_0.20_0)]' : 'text-[var(--color-cyan)]'
                        : isLegacy ? 'text-[oklch(0.60_0.15_0)]' : 'text-[var(--color-muted)]',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[9px] font-display tracking-wide leading-none">{item.label}</span>
                  </a>
                </Link>
              )
            })}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 px-1 text-[var(--color-muted)] active:scale-95"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-display tracking-wide leading-none">More</span>
            </button>
          </div>
        </nav>

        {/* Slide drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col">
              <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--color-border)]">
                <span className="font-display font-bold text-sm text-[var(--color-cyan)] tracking-wider">AURORA CORE</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 text-[var(--color-muted)]"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
                {NAV.map(({ path, icon: Icon, label }) => {
                  const isLegacy = path === '/legacy'
                  return (
                    <Link key={path} href={path}>
                      <a
                        onClick={() => setDrawerOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-3.5 rounded-lg transition-all active:scale-98',
                          isActive(path)
                            ? isLegacy
                              ? 'bg-[oklch(0.70_0.20_0_/_0.15)] text-[oklch(0.85_0.20_0)] border border-[oklch(0.70_0.20_0_/_0.4)]'
                              : 'bg-[oklch(0.82_0.16_196_/_0.12)] text-[var(--color-cyan)] border border-[oklch(0.82_0.16_196_/_0.3)]'
                            : isLegacy
                              ? 'text-[oklch(0.60_0.15_0)] hover:bg-[oklch(0.70_0.20_0_/_0.08)]'
                              : 'text-[var(--color-muted)] hover:bg-[var(--color-elevated)]',
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-display text-sm font-medium">{label}</span>
                      </a>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b border-[var(--color-border)]">
      <h1 className="font-display font-bold text-lg md:text-xl text-[var(--color-text)] tracking-wide">{title}</h1>
      {subtitle && <p className="text-[10px] text-[var(--color-muted)] mt-0.5 font-display tracking-wide">{subtitle}</p>}
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
