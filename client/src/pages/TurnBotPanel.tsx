import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Radio, Wifi, WifiOff, ToggleLeft, ToggleRight, Gauge, Battery, Upload, CheckCircle, XCircle, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const DEVICE_COLORS: Record<string, { color: string; colorClass: string }> = {
  mini: { color: "#22c55e", colorClass: "text-green-400 border-green-500/40 bg-green-500/10" },
  pro:  { color: "#a855f7", colorClass: "text-purple-400 border-purple-500/40 bg-purple-500/10" },
  hub:  { color: "#06b6d4", colorClass: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10" },
};

const DEVICE_SPECS: Record<string, { torqueMax: string; protocol: string; encoder: string; desc: string; latestFirmware: string }> = {
  mini: {
    torqueMax: "0.5 Nm",
    protocol: "BLE 5.3",
    encoder: "AS5600 Magnetic",
    desc: "Compact actuator for standard knobs and dials. Ideal for HVAC thermostats, water valves, and appliance controls.",
    latestFirmware: "1.3.0",
  },
  pro: {
    torqueMax: "2.0 Nm",
    protocol: "Thread / BLE 5.3",
    encoder: "AS5600 + Torque Sensor",
    desc: "High-torque actuator for industrial valves, gas shutoffs, and heavy-duty controls. Includes force feedback.",
    latestFirmware: "2.1.0",
  },
  hub: {
    torqueMax: "N/A",
    protocol: "Matter 1.5 / Thread / BLE 5.3 / Wi-Fi 6",
    encoder: "N/A",
    desc: "Central mesh coordinator. Manages up to 32 TurnBot devices, bridges to Aurora Core, and handles OTA firmware updates.",
    latestFirmware: "3.2.0",
  },
};

const OTA_STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  idle:        { label: "Up to date",   color: "text-muted-foreground",  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  pending:     { label: "Pending",      color: "text-amber-400",         icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  downloading: { label: "Downloading",  color: "text-blue-400",          icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  installing:  { label: "Installing",   color: "text-purple-400",        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  success:     { label: "Updated!",     color: "text-green-400",         icon: <CheckCircle className="h-3.5 w-3.5" /> },
  failed:      { label: "Failed",       color: "text-red-400",           icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function TurnBotPanel() {
  const { data: devices, refetch } = trpc.turnbot.list.useQuery();
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [otaDialog, setOtaDialog] = useState<{ deviceId: string; deviceName: string; targetVersion: string } | null>(null);
  const [simulatingOta, setSimulatingOta] = useState<string | null>(null);

  const toggleMutation = trpc.turnbot.toggle.useMutation({
    onSuccess: () => { refetch(); toast.success("Device updated"); },
    onError: () => toast.error("Toggle failed"),
  });

  const initiateOtaMutation = trpc.turnbot.initiateOta.useMutation({
    onSuccess: (_, vars) => {
      refetch();
      toast.success(`OTA update initiated for ${vars.deviceId}`);
      setOtaDialog(null);
      // Simulate OTA progress for demo
      simulateOtaProgress(vars.deviceId);
    },
    onError: () => toast.error("Failed to initiate OTA update"),
  });

  const updateOtaStatusMutation = trpc.turnbot.updateOtaStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const simulateOtaProgress = (deviceId: string) => {
    setSimulatingOta(deviceId);
    const steps: Array<{ status: "downloading" | "installing" | "success"; progress: number; delay: number }> = [
      { status: "downloading", progress: 25,  delay: 1000 },
      { status: "downloading", progress: 55,  delay: 2000 },
      { status: "downloading", progress: 85,  delay: 3000 },
      { status: "installing",  progress: 90,  delay: 4500 },
      { status: "installing",  progress: 95,  delay: 5500 },
      { status: "success",     progress: 100, delay: 7000 },
    ];
    steps.forEach(({ status, progress, delay }) => {
      setTimeout(() => {
        updateOtaStatusMutation.mutate({ deviceId, status, progress });
        if (status === "success") {
          setSimulatingOta(null);
          toast.success(`Firmware update complete for ${deviceId}`);
        }
      }, delay);
    });
  };

  const onlineCount = (devices ?? []).filter(d => d.isOnline).length;
  const activeCount = (devices ?? []).filter(d => d.isActive).length;

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">TurnBot Devices</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Physical actuator network management & OTA firmware updates</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 status-blink" />
              <span className="text-xs text-green-400 font-mono">{onlineCount}/{(devices ?? []).length} ONLINE</span>
            </div>
          </div>
        </div>

        {/* Summary stats */}
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
            const otaState = OTA_STATUS_LABELS[device.otaStatus ?? "idle"] ?? OTA_STATUS_LABELS.idle;
            const hasUpdate = device.firmwareVersion !== spec.latestFirmware && (device.otaStatus === "idle" || device.otaStatus === "failed");
            const isUpdating = ["pending", "downloading", "installing"].includes(device.otaStatus ?? "");
            const isExpanded = expandedDevice === device.deviceId;

            return (
              <div key={device.deviceId} className={`rounded-xl border transition-all duration-200 overflow-hidden ${dc.colorClass}`}>
                {/* Card header row */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${dc.color}15`, border: `2px solid ${dc.color}40`, boxShadow: device.isOnline ? `0 0 12px ${dc.color}30` : "none" }}
                    >
                      <Radio className="h-6 w-6" style={{ color: dc.color }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-base text-foreground">{device.name}</span>
                        {device.isOnline ? (
                          <Wifi className="h-3.5 w-3.5 text-green-400" />
                        ) : (
                          <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                        <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${device.isOnline ? "text-green-400 bg-green-500/10" : "text-muted-foreground bg-muted/20"}`}>
                          {device.isOnline ? "ONLINE" : "OFFLINE"}
                        </span>
                        {hasUpdate && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 animate-pulse">
                            UPDATE AVAILABLE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{spec.desc}</p>

                      {/* Firmware row */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Firmware:</span>
                          <span className="text-xs font-mono font-bold text-foreground/80">v{device.firmwareVersion}</span>
                          {hasUpdate && (
                            <span className="text-xs text-muted-foreground">→ <span className="text-amber-400 font-mono">v{spec.latestFirmware}</span> available</span>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 ${otaState.color}`}>
                          {otaState.icon}
                          <span className="text-xs font-mono">{otaState.label}</span>
                        </div>
                      </div>

                      {/* OTA progress bar (shown when updating) */}
                      {isUpdating && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono" style={{ color: dc.color }}>
                              {device.otaStatus?.toUpperCase()} — {Math.round(device.otaProgress ?? 0)}%
                            </span>
                          </div>
                          <Progress
                            value={device.otaProgress ?? 0}
                            className="h-2"
                            style={{ "--progress-color": dc.color } as React.CSSProperties}
                          />
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                          <div className="text-xs text-muted-foreground mb-0.5">Protocol</div>
                          <div className="text-xs font-mono font-bold text-foreground/70 truncate">{spec.protocol.split(" / ")[0]}</div>
                        </div>
                      </div>

                      {/* Battery bar */}
                      <div className="mt-2">
                        <div className="h-1 rounded-full bg-border/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${battPct}%`, background: battColor }} />
                        </div>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {/* Toggle */}
                      <div className="flex flex-col items-center gap-0.5">
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

                      {/* OTA button */}
                      {hasUpdate && device.isOnline && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs px-2 py-1 h-auto border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                          onClick={() => setOtaDialog({ deviceId: device.deviceId, deviceName: device.name, targetVersion: spec.latestFirmware })}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Update
                        </Button>
                      )}

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedDevice(isExpanded ? null : device.deviceId)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded: rotation/torque bars */}
                  {isExpanded && device.type !== "hub" && (
                    <div className="mt-3 pt-3 border-t border-current/10 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Rotation</span>
                        <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${((device.position ?? 0) / 360) * 100}%`, background: dc.color }} />
                        </div>
                        <span className="text-xs font-mono w-20 text-right" style={{ color: dc.color }}>{device.position}° / 360°</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-16">Torque</span>
                        <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${((device.torque ?? 0) / (device.type === "pro" ? 2 : 0.5)) * 100}%`, background: dc.color }} />
                        </div>
                        <span className="text-xs font-mono w-20 text-right" style={{ color: dc.color }}>{device.torque?.toFixed(2)} / {spec.torqueMax}</span>
                      </div>
                    </div>
                  )}

                  {/* Expanded: OTA history for hub */}
                  {isExpanded && device.type === "hub" && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <p className="text-xs text-muted-foreground">
                        TurnBot Hub manages OTA updates for all connected Mini and Pro devices via Matter 1.5 / Thread mesh. It buffers firmware packages locally and distributes them to nodes during low-activity windows to minimize disruption.
                      </p>
                    </div>
                  )}
                </div>
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

        {/* Spec comparison table */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Device Specifications</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Model</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Max Torque</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Protocol</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Encoder</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Latest FW</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "TurnBot Mini", color: "#22c55e", ...DEVICE_SPECS.mini },
                  { name: "TurnBot Pro",  color: "#a855f7", ...DEVICE_SPECS.pro  },
                  { name: "TurnBot Hub",  color: "#06b6d4", ...DEVICE_SPECS.hub  },
                ].map(d => (
                  <tr key={d.name} className="border-b border-border/10 last:border-0">
                    <td className="py-2 pr-4 font-semibold" style={{ color: d.color }}>{d.name}</td>
                    <td className="py-2 pr-4 font-mono text-foreground/70">{d.torqueMax}</td>
                    <td className="py-2 pr-4 text-foreground/70">{d.protocol}</td>
                    <td className="py-2 pr-4 text-foreground/70">{d.encoder}</td>
                    <td className="py-2 font-mono text-foreground/70">v{d.latestFirmware}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* OTA Confirmation Dialog */}
      <Dialog open={!!otaDialog} onOpenChange={() => setOtaDialog(null)}>
        <DialogContent className="bg-card border-border/50 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Upload className="h-5 w-5 text-amber-400" />
              Firmware Update
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update <span className="font-semibold text-foreground">{otaDialog?.deviceName}</span> to firmware <span className="font-mono text-amber-400">v{otaDialog?.targetVersion}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 space-y-1">
            <p className="font-semibold">Before updating:</p>
            <p>• The device will be temporarily offline during installation (~30s)</p>
            <p>• Active operations will be paused and resumed after reboot</p>
            <p>• The Hub will coordinate the update via Thread mesh</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setOtaDialog(null)} className="border-border/50">
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              disabled={initiateOtaMutation.isPending}
              onClick={() => otaDialog && initiateOtaMutation.mutate({ deviceId: otaDialog.deviceId, targetVersion: otaDialog.targetVersion })}
            >
              {initiateOtaMutation.isPending ? (
                <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Starting...</>
              ) : (
                <><Upload className="h-3.5 w-3.5 mr-1.5" /> Install Update</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuroraDashboardLayout>
  );
}
