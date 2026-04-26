import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { TriangleAlert, CheckCircle, Info, Zap, Battery, BrainCircuit, Radio, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";

const SEVERITY_STYLES: Record<string, { cls: string; icon: React.ElementType; label: string }> = {
  critical: { cls: "text-red-400 border-red-500/40 bg-red-500/10", icon: TriangleAlert, label: "Critical" },
  warning: { cls: "text-amber-400 border-amber-500/40 bg-amber-500/10", icon: TriangleAlert, label: "Warning" },
  info: { cls: "text-blue-400 border-blue-500/40 bg-blue-500/10", icon: Info, label: "Info" },
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  circuit: Zap,
  battery: Battery,
  agent: BrainCircuit,
  device: Radio,
  system: Settings,
};

export default function AlertsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: alerts, refetch } = trpc.alerts.list.useQuery();
  const resolveMutation = trpc.alerts.resolve.useMutation({
    onSuccess: () => { refetch(); toast.success("Alert resolved"); },
    onError: () => toast.error("Failed to resolve alert"),
  });
  const createMutation = trpc.alerts.create.useMutation({
    onSuccess: () => { refetch(); toast.success("Test alert created"); },
  });

  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  const filtered = (alerts ?? []).filter(a => {
    if (filter === "active" && a.isResolved) return false;
    if (filter === "resolved" && !a.isResolved) return false;
    if (severityFilter !== "all" && a.severity !== severityFilter) return false;
    return true;
  });

  const activeCount = (alerts ?? []).filter(a => !a.isResolved).length;
  const criticalCount = (alerts ?? []).filter(a => !a.isResolved && a.severity === "critical").length;
  const warningCount = (alerts ?? []).filter(a => !a.isResolved && a.severity === "warning").length;

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alert Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">System alerts, circuit events, and agent notifications</p>
          </div>
          {isAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="border-border/40 text-muted-foreground hover:text-foreground text-xs"
              onClick={() => createMutation.mutate({
                type: "system",
                severity: "warning",
                title: "Test Alert",
                message: "This is a test alert generated from the Aurora Core dashboard.",
              })}
            >
              + Test Alert
            </Button>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-red-400">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-amber-400">{warningCount}</div>
            <div className="text-xs text-muted-foreground">Warnings</div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-green-400">{(alerts ?? []).filter(a => a.isResolved).length}</div>
            <div className="text-xs text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-lg border border-border/40 overflow-hidden">
            {(["all", "active", "resolved"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-purple-500/20 text-purple-300" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border/40 overflow-hidden">
            {(["all", "critical", "warning", "info"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSeverityFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium transition-all ${severityFilter === s ? "bg-purple-500/20 text-purple-300" : "text-muted-foreground hover:text-foreground"}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div className="space-y-2">
          {filtered.map((alert) => {
            const sev = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info;
            const SevIcon = sev.icon;
            const TypeIcon = TYPE_ICONS[alert.type] ?? Settings;
            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-3 transition-all ${alert.isResolved ? "opacity-50 border-border/20 bg-background/30" : sev.cls}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <SevIcon className={`h-4 w-4 ${alert.isResolved ? "text-muted-foreground" : ""}`} />
                    <TypeIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{alert.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono uppercase ${alert.isResolved ? "text-muted-foreground bg-muted/20" : sev.cls}`}>
                        {alert.isResolved ? "resolved" : alert.severity}
                      </span>
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted/20">{alert.type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5 font-mono">
                      {new Date(alert.createdAt).toLocaleString()}
                      {alert.isResolved && alert.resolvedAt && ` · Resolved ${new Date(alert.resolvedAt).toLocaleString()}`}
                    </p>
                  </div>
                  {!alert.isResolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      onClick={() => resolveMutation.mutate({ id: alert.id })}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-400/30" />
              <p className="text-sm">No alerts match the current filter</p>
            </div>
          )}
        </div>

        {/* Owner notification note */}
        {isAdmin && (
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-400 shrink-0" />
              <p className="text-xs text-purple-300">
                As admin, you receive push notifications for critical alerts, battery warnings, and agent conflict resolutions via the Manus notification system.
              </p>
            </div>
          </div>
        )}
      </div>
    </AuroraDashboardLayout>
  );
}
