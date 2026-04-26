import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { toast } from "sonner";
import { Battery, BatteryCharging, Thermometer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function mockBatteryHistory() {
  let soc = 78.5;
  return Array.from({ length: 24 }, (_, i) => {
    soc += (Math.random() - 0.48) * 2;
    soc = Math.max(20, Math.min(95, soc));
    return { h: `${i}:00`, soc: +soc.toFixed(1) };
  });
}

const historyData = mockBatteryHistory();

export default function BatteryPanel() {
  const { data: battery, refetch } = trpc.battery.latest.useQuery();
  const dispatchMutation = trpc.battery.dispatch.useMutation({
    onSuccess: () => { refetch(); toast.success("Battery dispatch updated"); },
    onError: () => toast.error("Dispatch failed"),
  });

  const soc = battery?.stateOfCharge ?? 78.5;
  const soh = battery?.stateOfHealth ?? 94.2;
  const voltage = battery?.voltage ?? 51.6;
  const current = battery?.current ?? 8.4;
  const temp = battery?.temperature ?? 28.3;
  const isDispatching = battery?.isDispatching ?? false;

  const socColor = soc > 60 ? "#22c55e" : soc > 30 ? "#f59e0b" : "#ef4444";
  const sohColor = soh > 80 ? "#22c55e" : soh > 60 ? "#f59e0b" : "#ef4444";

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Battery Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">State-of-charge, health, and dispatch controls</p>
        </div>

        {/* Main battery display */}
        <div className="rounded-xl border border-border/40 bg-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {isDispatching ? (
                <BatteryCharging className="h-12 w-12 text-green-400" />
              ) : (
                <Battery className="h-12 w-12 text-amber-400" />
              )}
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${isDispatching ? "bg-green-400" : "bg-amber-400"} status-blink`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Main Battery Pack</h2>
              <p className="text-sm text-muted-foreground">
                {isDispatching ? "⚡ Dispatching to grid" : "● Standby / Charging"}
              </p>
            </div>
            <div className="ml-auto">
              <Button
                size="sm"
                variant={isDispatching ? "destructive" : "default"}
                className={isDispatching ? "" : "bg-green-600 hover:bg-green-500 text-white"}
                onClick={() => dispatchMutation.mutate({ isDispatching: !isDispatching })}
                disabled={dispatchMutation.isPending}
              >
                {isDispatching ? "Stop Dispatch" : "Dispatch"}
              </Button>
            </div>
          </div>

          {/* SoC gauge */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">State of Charge</span>
              <span className="text-2xl font-bold font-mono" style={{ color: socColor }}>{soc.toFixed(1)}%</span>
            </div>
            <div className="h-4 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${soc}%`, background: `linear-gradient(90deg, ${socColor}aa, ${socColor})`, boxShadow: `0 0 10px ${socColor}60` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span className="text-amber-400">30% — Low</span>
              <span className="text-green-400">60% — Good</span>
              <span>100%</span>
            </div>
          </div>

          {/* SoH gauge */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">State of Health</span>
              <span className="text-xl font-bold font-mono" style={{ color: sohColor }}>{soh.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-border/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${soh}%`, background: sohColor }}
              />
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Voltage", value: `${voltage.toFixed(1)}V`, icon: Zap, color: "text-cyan-400" },
              { label: "Current", value: `${Math.abs(current).toFixed(1)}A`, icon: Zap, color: current > 0 ? "text-green-400" : "text-red-400" },
              { label: "Temperature", value: `${temp.toFixed(1)}°C`, icon: Thermometer, color: temp > 35 ? "text-red-400" : "text-amber-400" },
              { label: "Power", value: `${(voltage * Math.abs(current) / 1000).toFixed(2)}kW`, icon: Battery, color: "text-purple-400" },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="rounded-lg border border-border/30 bg-background/50 p-3 text-center">
                  <Icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                  <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SoC history chart */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">State of Charge — 24h History</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={historyData}>
              <defs>
                <linearGradient id="socLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <XAxis dataKey="h" tick={{ fontSize: 9, fill: "#666" }} interval={3} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#666" }} unit="%" />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "6px", fontSize: "11px" }}
                formatter={(v: number) => [`${v}%`, "SoC"]}
              />
              <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={60} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Line type="monotone" dataKey="soc" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Dispatch info */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Dispatch Controls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Peak Shave Mode", desc: "Discharge during peak tariff hours (3–8pm)", action: "Activate", color: "bg-amber-600 hover:bg-amber-500" },
              { label: "Grid Response", desc: "Respond to utility demand response signals", action: "Standby", color: "bg-blue-600 hover:bg-blue-500" },
              { label: "Emergency Reserve", desc: "Hold 20% minimum SoC for outage protection", action: "Enable", color: "bg-red-600 hover:bg-red-500" },
            ].map(d => (
              <div key={d.label} className="rounded-lg border border-border/30 bg-background/50 p-3">
                <h3 className="text-xs font-semibold text-foreground mb-1">{d.label}</h3>
                <p className="text-xs text-muted-foreground mb-2">{d.desc}</p>
                <Button size="sm" className={`w-full text-white text-xs ${d.color}`} onClick={() => toast.info(`${d.label} — feature coming soon`)}>
                  {d.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
