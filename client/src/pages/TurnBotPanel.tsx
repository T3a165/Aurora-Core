import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Radio, Wifi, WifiOff, ToggleLeft, ToggleRight, Gauge, Battery } from "lucide-react";

const DEVICE_COLORS: Record<string, { color: string; colorClass: string }> = {
  mini: { color: "#22c55e", colorClass: "text-green-400 border-green-500/40 bg-green-500/10" },
  pro: { color: "#a855f7", colorClass: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  hub: { color: "#06b6d4", colorClass: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
};

const DEVICE_SPECS: Record<string, { torqueMax: string; protocol: string; encoder: string; desc: string }> = {
  mini: {
    torqueMax: "0.5 Nm",
    protocol: "BLE 5.3",
    encoder: "AS5600 Magnetic",
    desc: "Compact actuator for standard knobs and dials. Ideal for HVAC thermostats, water valves, and appliance controls.",
  },
  pro: {
    torqueMax: "2.0 Nm",
    protocol: "Thread / BLE 5.3",
    encoder: "AS5600 + Torque Sensor",
    desc: "High-torque actuator for industrial valves, gas shutoffs, and heavy-duty controls. Includes force feedback.",
  },
  hub: {
    torqueMax: "N/A",
    protocol: "Matter 1.5 / Thread / BLE 5.3 / Wi-Fi 6",
    encoder: "N/A",
    desc: "Central mesh coordinator. Manages up to 32 TurnBot devices, bridges to Aurora Core, and handles OTA firmware updates.",
  },
};

export default function TurnBotPanel() {
  const { data: devices, refetch } = trpc.turnbot.list.useQuery();
  const toggleMutation = trpc.turnbot.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Device updated"); },
    onError: () => toast.error("Toggle failed"),
  });

  const onlineCount = (devices ?? []).filter(d => d.isOnline).length;
  const activeCount = (devices ?? []).filter(d => d.isActive).length;

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">TurnBot Devices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Physical actuator network management</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 status-blink" />
              <span className="text-xs text-green-400 font-mono">{onlineCount}/{(devices ?? []).length} ONLINE</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-cyan-400">{(devices ?? []).length}</div>
            <div className="text-xs text-muted-foreground">Total Devices</div>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-green-400">{onlineCount}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-center">
            <div className="text-xl font-bold font-mono text-purple-400">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>

        {/* Device cards */}
        <div className="space-y-3">
          {(devices ?? []).map((device) => {
            const dc = DEVICE_COLORS[device.type] ?? DEVICE_COLORS.mini;
            const spec = DEVICE_SPECS[device.type] ?? DEVICE_SPECS.mini;
            const battPct = device.batteryLevel ?? 0;
            const battColor = battPct > 50 ? "#22c55e" : battPct > 20 ? "#f59e0b" : "#ef4444";

            return (
              <div key={device.deviceId} className={`rounded-xl border ${dc.colorClass} p-4`}>
                <div className="flex items-start gap-3">
                  {/* Device icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${dc.color}15`, border: `2px solid ${dc.color}40`, boxShadow: device.isOnline ? `0 0 12px ${dc.color}30` : "none" }}
                  >
                    <Radio className="h-6 w-6" style={{ color: dc.color }} />
                  </div>

                  {/* Device info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base text-foreground">{device.name}</span>
                      {device.isOnline ? (
                        <Wifi className="h-3.5 w-3.5 text-green-400" />
                      ) : (
                        <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${device.isOnline ? "text-green-400 bg-green-500/10" : "text-muted-foreground bg-muted/20"}`}>
                        {device.isOnline ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">{spec.desc}</p>

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                      <div className="rounded-lg bg-background/40 p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Gauge className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Torque</span>
                        </div>
                        <div className="text-sm font-mono font-bold" style={{ color: dc.color }}>
                          {device.type === "hub" ? "N/A" : `${device.torque?.toFixed(2)} Nm`}
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/40 p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Radio className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Position</span>
                        </div>
                        <div className="text-sm font-mono font-bold" style={{ color: dc.color }}>
                          {device.type === "hub" ? "N/A" : `${device.position}°`}
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/40 p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Battery className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Battery</span>
                        </div>
                        <div className="text-sm font-mono font-bold" style={{ color: battColor }}>
                          {battPct}%
                        </div>
                      </div>

                      <div className="rounded-lg bg-background/40 p-2">
                        <div className="text-xs text-muted-foreground mb-0.5">Firmware</div>
                        <div className="text-xs font-mono font-bold text-foreground/70">v{device.firmwareVersion}</div>
                      </div>
                    </div>

                    {/* Battery bar */}
                    <div className="mb-2">
                      <div className="h-1 rounded-full bg-border/30 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${battPct}%`, background: battColor }} />
                      </div>
                    </div>

                    {/* Protocol */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Protocol:</span>
                      <span className="text-xs font-mono" style={{ color: dc.color }}>{spec.protocol}</span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">Active</span>
                    <button
                      onClick={() => toggleMutation.mutate({ deviceId: device.deviceId, isActive: !device.isActive })}
                      disabled={!device.isOnline || toggleMutation.isPending}
                      className="transition-all disabled:opacity-40"
                    >
                      {device.isActive ? (
                        <ToggleRight className="h-8 w-8" style={{ color: dc.color }} />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                      )}
                    </button>
                    <span className={`text-xs font-mono ${device.isActive ? "" : "text-muted-foreground"}`} style={device.isActive ? { color: dc.color } : {}}>
                      {device.isActive ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>

                {/* Torque visualization for non-hub */}
                {device.type !== "hub" && (
                  <div className="mt-3 pt-3 border-t border-current/10">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">Rotation</span>
                      <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${((device.position ?? 0) / 360) * 100}%`, background: dc.color }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: dc.color }}>{device.position}° / 360°</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">Torque</span>
                      <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${((device.torque ?? 0) / (device.type === "pro" ? 2 : 0.5)) * 100}%`, background: dc.color }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: dc.color }}>{device.torque?.toFixed(2)} / {spec.torqueMax}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {(!devices || devices.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No TurnBot devices — visit Dashboard to seed demo data</p>
            </div>
          )}
        </div>

        {/* Spec comparison */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Device Specifications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Model</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Max Torque</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Protocol</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Encoder</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "TurnBot Mini", color: "#22c55e", ...DEVICE_SPECS.mini },
                  { name: "TurnBot Pro", color: "#a855f7", ...DEVICE_SPECS.pro },
                  { name: "TurnBot Hub", color: "#06b6d4", ...DEVICE_SPECS.hub },
                ].map(d => (
                  <tr key={d.name} className="border-b border-border/10 last:border-0">
                    <td className="py-2 pr-4 font-semibold" style={{ color: d.color }}>{d.name}</td>
                    <td className="py-2 pr-4 font-mono text-foreground/70">{d.torqueMax}</td>
                    <td className="py-2 pr-4 text-foreground/70">{d.protocol}</td>
                    <td className="py-2 text-foreground/70">{d.encoder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
