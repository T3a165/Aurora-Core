import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Activity, Battery, BrainCircuit, Cpu, Radio, TriangleAlert, Zap, Layers, MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

const QUICK_STATS = [
  { label: "Cognitive Layers", value: "7", sub: "All Active", icon: Layers, color: "purple", path: "/layers" },
  { label: "AI Agents", value: "4", sub: "Synchronized", icon: BrainCircuit, color: "cyan", path: "/agents" },
  { label: "Circuits", value: "6", sub: "Monitored", icon: Zap, color: "amber", path: "/circuits" },
  { label: "Battery SoC", value: "78.5%", sub: "Healthy", icon: Battery, color: "green", path: "/battery" },
  { label: "TurnBot Devices", value: "3", sub: "2 Online", icon: Radio, color: "blue", path: "/turnbot" },
  { label: "Active Alerts", value: "—", sub: "Loading...", icon: TriangleAlert, color: "red", path: "/alerts" },
];

const COLOR_MAP: Record<string, string> = {
  purple: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  amber: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  green: "text-green-400 bg-green-500/10 border-green-500/30",
  blue: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  red: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const seedCircuits = trpc.circuits.seed.useMutation();
  const seedBattery = trpc.battery.seed.useMutation();
  const seedDevices = trpc.turnbot.seed.useMutation();
  const seedAgents = trpc.agents.seed.useMutation();
  const { data: alerts } = trpc.alerts.list.useQuery();
  const { data: agentLogs } = trpc.agents.logs.useQuery();

  // Auto-seed demo data on first load
  useEffect(() => {
    const seeded = localStorage.getItem("aurora-seeded");
    if (!seeded) {
      Promise.all([
        seedCircuits.mutateAsync(),
        seedBattery.mutateAsync(),
        seedDevices.mutateAsync(),
        seedAgents.mutateAsync(),
      ]).then(() => {
        localStorage.setItem("aurora-seeded", "1");
      }).catch(() => {});
    }
  }, []);

  const activeAlerts = alerts?.filter(a => !a.isResolved) ?? [];
  const criticalAlerts = activeAlerts.filter(a => a.severity === "critical");

  return (
    <AuroraDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold neon-text-purple">Aurora Core</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Cognitive-Energy Ecosystem · Beta Testing</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 status-blink" />
            <span className="text-xs text-green-400 font-mono">SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Critical alert banner */}
        {criticalAlerts.length > 0 && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 flex items-center gap-3">
            <TriangleAlert className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{criticalAlerts.length} critical alert{criticalAlerts.length > 1 ? "s" : ""} require attention</span>
            <button onClick={() => setLocation("/alerts")} className="ml-auto text-xs text-red-400 hover:text-red-300 underline">View →</button>
          </div>
        )}

        {/* Quick stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_STATS.map((stat, i) => {
            const Icon = stat.icon;
            const colorClass = COLOR_MAP[stat.color];
            const displayValue = stat.label === "Active Alerts" ? String(activeAlerts.length) : stat.value;
            const displaySub = stat.label === "Active Alerts" ? `${criticalAlerts.length} critical` : stat.sub;
            return (
              <button
                key={i}
                onClick={() => setLocation(stat.path)}
                className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${colorClass}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium opacity-80">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold font-mono">{displayValue}</div>
                <div className="text-xs opacity-60 mt-0.5">{displaySub}</div>
              </button>
            );
          })}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent agent activity */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-foreground">Recent Agent Activity</h2>
              <div className="ml-auto">
                <button onClick={() => setLocation("/agents")} className="text-xs text-purple-400 hover:text-purple-300">View all →</button>
              </div>
            </div>
            <div className="space-y-2">
              {(agentLogs ?? []).slice(0, 4).map((log, i) => {
                const agentColors: Record<string, string> = {
                  health: "text-red-400 bg-red-500/10",
                  energy: "text-amber-400 bg-amber-500/10",
                  behavior: "text-blue-400 bg-blue-500/10",
                  environment: "text-green-400 bg-green-500/10",
                };
                const cls = agentColors[log.agentId] ?? "text-purple-400 bg-purple-500/10";
                return (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${cls}`}>{log.agentId}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-foreground/80 truncate">{log.action}</p>
                      {log.hasConflict && <span className="text-xs text-amber-400">⚡ Conflict resolved</span>}
                    </div>
                  </div>
                );
              })}
              {(!agentLogs || agentLogs.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No agent activity yet</p>
              )}
            </div>
          </div>

          {/* System layers status */}
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-foreground">Cognitive Layer Status</h2>
              <button onClick={() => setLocation("/layers")} className="ml-auto text-xs text-cyan-400 hover:text-cyan-300">Explore →</button>
            </div>
            <div className="space-y-1.5">
              {[
                { n: 1, label: "Bio", color: "bg-green-400", status: "Active" },
                { n: 2, label: "Ingest", color: "bg-blue-400", status: "Active" },
                { n: 3, label: "Cognitive Core", color: "bg-purple-400", status: "Active" },
                { n: 4, label: "Predictive", color: "bg-amber-400", status: "Active" },
                { n: 5, label: "Decision", color: "bg-red-400", status: "Active" },
                { n: 6, label: "Execution", color: "bg-cyan-400", status: "Active" },
                { n: 7, label: "Optimization Loop", color: "bg-pink-400", status: "Active" },
              ].map(layer => (
                <div key={layer.n} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-4">L{layer.n}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${layer.color} status-blink`} style={{ animationDelay: `${layer.n * 0.2}s` }} />
                  <span className="text-xs text-foreground/70 flex-1">{layer.label}</span>
                  <span className="text-xs text-green-400 font-mono">{layer.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "AI Chat", icon: MessageSquare, path: "/chat", color: "purple" },
              { label: "Simulation", icon: Cpu, path: "/simulation", color: "amber" },
              { label: "Circuits", icon: Zap, path: "/circuits", color: "cyan" },
              { label: "Alerts", icon: TriangleAlert, path: "/alerts", color: "red" },
            ].map(item => {
              const Icon = item.icon;
              const cls = COLOR_MAP[item.color];
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex items-center gap-2 rounded-lg border p-3 transition-all hover:scale-[1.02] ${cls}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
