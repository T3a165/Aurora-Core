import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Zap, ToggleLeft, ToggleRight, TriangleAlert } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  normal: "text-green-400 bg-green-500/10 border-green-500/30",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  critical: "text-red-400 bg-red-500/10 border-red-500/30",
};

// Generate mock history data for charts
function mockHistory(base: number, points = 12) {
  return Array.from({ length: points }, (_, i) => ({
    t: `${i * 5}m`,
    v: +(base + (Math.random() - 0.5) * base * 0.15).toFixed(1),
  }));
}

export default function CircuitMonitor() {
  const { data: circuits, refetch } = trpc.circuits.list.useQuery();
  const toggleMutation = trpc.circuits.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Circuit updated"); },
    onError: () => toast.error("Failed to update circuit"),
  });
  const [selectedCircuit, setSelectedCircuit] = useState<string | null>(null);

  const totalPower = (circuits ?? []).filter(c => c.isOn).reduce((s, c) => s + (c.power ?? 0), 0);
  const criticalCount = (circuits ?? []).filter(c => c.status === "critical").length;
  const warningCount = (circuits ?? []).filter(c => c.status === "warning").length;

  const selected = circuits?.find(c => c.circuitId === selectedCircuit);
  const historyData = selected ? mockHistory(selected.power ?? 100) : [];

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Circuit Monitor</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time breaker controls and energy consumption</p>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full">
                <TriangleAlert className="h-3 w-3" /> {criticalCount} critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full">
                <TriangleAlert className="h-3 w-3" /> {warningCount} warning
              </span>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-amber-400">{(totalPower / 1000).toFixed(2)} kW</div>
            <div className="text-xs text-muted-foreground">Total Active Load</div>
          </div>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-cyan-400">{(circuits ?? []).filter(c => c.isOn).length}/{(circuits ?? []).length}</div>
            <div className="text-xs text-muted-foreground">Circuits Active</div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-green-400">617W</div>
            <div className="text-xs text-muted-foreground">Solar Input</div>
          </div>
        </div>

        {/* Circuit list */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Breaker Panel</h2>
          <div className="space-y-2">
            {(circuits ?? []).map((circuit) => {
              const statusCls = STATUS_COLORS[circuit.status ?? "normal"];
              const isSelected = selectedCircuit === circuit.circuitId;
              return (
                <div
                  key={circuit.circuitId}
                  className={`rounded-lg border p-3 transition-all cursor-pointer ${isSelected ? statusCls : "border-border/30 bg-background/50 hover:border-border/60"}`}
                  onClick={() => setSelectedCircuit(isSelected ? null : circuit.circuitId)}
                >
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div className={`w-2 h-2 rounded-full shrink-0 ${circuit.status === "critical" ? "bg-red-400 status-blink" : circuit.status === "warning" ? "bg-amber-400" : "bg-green-400"}`} />

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{circuit.circuitName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${statusCls}`}>{circuit.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{circuit.voltage?.toFixed(1)}V</span>
                        <span className="text-xs text-muted-foreground font-mono">{circuit.current?.toFixed(1)}A</span>
                        <span className="text-xs font-mono text-amber-400">{circuit.power?.toFixed(0)}W</span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMutation.mutate({ circuitId: circuit.circuitId, isOn: !circuit.isOn });
                      }}
                      className="shrink-0 transition-colors"
                    >
                      {circuit.isOn ? (
                        <ToggleRight className="h-6 w-6 text-green-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                  </div>

                  {/* Expanded chart */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border/20">
                      <p className="text-xs text-muted-foreground mb-2">Power consumption — last 60 min</p>
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={historyData}>
                          <defs>
                            <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#666" }} />
                          <YAxis tick={{ fontSize: 9, fill: "#666" }} />
                          <Tooltip
                            contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "6px", fontSize: "11px" }}
                            labelStyle={{ color: "#aaa" }}
                          />
                          <Area type="monotone" dataKey="v" stroke="#f59e0b" fill="url(#powerGrad)" strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
            {(!circuits || circuits.length === 0) && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No circuit data — visit Dashboard to seed demo data
              </div>
            )}
          </div>
        </div>

        {/* Power distribution chart */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Load Distribution</h2>
          <div className="space-y-2">
            {(circuits ?? []).filter(c => c.isOn && (c.power ?? 0) > 0).map((c) => {
              const pct = totalPower > 0 ? ((c.power ?? 0) / totalPower) * 100 : 0;
              return (
                <div key={c.circuitId} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 truncate">{c.circuitName}</span>
                  <div className="flex-1 h-2 rounded-full bg-border/30 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: c.status === "critical" ? "#ef4444" : c.status === "warning" ? "#f59e0b" : "#22c55e" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-amber-400 w-14 text-right">{(c.power ?? 0).toFixed(0)}W</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
