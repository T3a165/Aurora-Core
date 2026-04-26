import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";

const AGENTS = [
  {
    id: "health",
    label: "Health",
    icon: "♥",
    color: "#ef4444",
    colorClass: "text-red-400 border-red-500/40 bg-red-500/10",
    desc: "Monitors biometric data from wearables (HR, HRV, SpO₂, stress), hardware diagnostics, and triggers safety fallbacks on overcurrent conditions.",
    metrics: [
      { label: "HRV", value: "58ms", status: "normal" },
      { label: "SpO₂", value: "98%", status: "normal" },
      { label: "Stress", value: "Low", status: "normal" },
      { label: "Sleep Score", value: "82", status: "normal" },
    ],
    confidence: 97,
  },
  {
    id: "energy",
    label: "Energy",
    icon: "⚡",
    color: "#f59e0b",
    colorClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    desc: "Optimizes energy consumption targeting peak-load periods. Manages demand response, solar/battery dispatch, and EV charging schedules.",
    metrics: [
      { label: "Peak Load", value: "2.4kW", status: "warning" },
      { label: "Solar Gen", value: "617W", status: "normal" },
      { label: "Savings/mo", value: "$47", status: "normal" },
      { label: "Grid Draw", value: "1.8kW", status: "normal" },
    ],
    confidence: 92,
  },
  {
    id: "behavior",
    label: "Behavior",
    icon: "🧠",
    color: "#3b82f6",
    colorClass: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    desc: "Encodes human preferences and comfort scores. Uses LangGraph/AutoGen to manage complex state and memory, learning from manual overrides.",
    metrics: [
      { label: "Routine Match", value: "88%", status: "normal" },
      { label: "Comfort Score", value: "9.1/10", status: "normal" },
      { label: "Overrides", value: "3 today", status: "normal" },
      { label: "Patterns", value: "14 learned", status: "normal" },
    ],
    confidence: 88,
  },
  {
    id: "environment",
    label: "Environment",
    icon: "🌿",
    color: "#22c55e",
    colorClass: "text-green-400 border-green-500/40 bg-green-500/10",
    desc: "Tracks external weather forecasts, internal air quality (CO₂, PM2.5, humidity), and occupancy patterns to optimize ventilation and thermal comfort.",
    metrics: [
      { label: "CO₂", value: "1240ppm", status: "warning" },
      { label: "PM2.5", value: "8μg/m³", status: "normal" },
      { label: "Humidity", value: "52%", status: "normal" },
      { label: "Temp", value: "72°F", status: "normal" },
    ],
    confidence: 95,
  },
];

// Connection pairs between agents
const CONNECTIONS = [
  { from: 0, to: 1, label: "thermal cost" },
  { from: 0, to: 2, label: "comfort" },
  { from: 1, to: 3, label: "ventilation" },
  { from: 2, to: 3, label: "occupancy" },
  { from: 0, to: 3, label: "air quality" },
  { from: 1, to: 2, label: "schedule" },
];

export default function AgentPanel() {
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const { data: logs, refetch } = trpc.agents.logs.useQuery();
  const logMutation = trpc.agents.log.useMutation({
    onSuccess: () => { refetch(); toast.success("Agent activity logged"); },
  });
  const svgRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);

  // Animate connection lines
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(id);
  }, []);

  const agentPositions = [
    { x: 25, y: 25 }, // health
    { x: 75, y: 25 }, // energy
    { x: 25, y: 75 }, // behavior
    { x: 75, y: 75 }, // environment
  ];

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">AI Agent Panel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Four specialized agents with weighted inter-agent communication</p>
        </div>

        {/* Agent field visualization */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Cognitive Core — Multi-Agent Field</h2>
          <div className="relative w-full aspect-square max-w-xs mx-auto">
            {/* SVG connection lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" ref={svgRef}>
              {/* Background glow */}
              <defs>
                <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="50" cy="50" r="50" fill="url(#center-glow)" />

              {/* Connection lines */}
              {CONNECTIONS.map((conn, i) => {
                const from = agentPositions[conn.from];
                const to = agentPositions[conn.to];
                const agent = AGENTS[conn.from];
                const offset = (tick * 0.5 + i * 20) % 100;
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={agent.color}
                      strokeWidth="0.5"
                      strokeOpacity="0.3"
                    />
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={agent.color}
                      strokeWidth="1"
                      strokeOpacity="0.8"
                      strokeDasharray="4 8"
                      strokeDashoffset={-offset}
                    />
                  </g>
                );
              })}

              {/* Center node */}
              <circle cx="50" cy="50" r="4" fill="#a855f7" fillOpacity="0.8">
                <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="50" cy="50" r="8" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeOpacity="0.4">
                <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Agent nodes */}
              {AGENTS.map((agent, i) => {
                const pos = agentPositions[i];
                const isActive = activeAgent === agent.id;
                return (
                  <g key={agent.id} style={{ cursor: "pointer" }} onClick={() => setActiveAgent(isActive ? null : agent.id)}>
                    <circle
                      cx={pos.x} cy={pos.y} r={isActive ? 9 : 7}
                      fill={agent.color}
                      fillOpacity={isActive ? 0.9 : 0.6}
                      style={{ filter: isActive ? `drop-shadow(0 0 6px ${agent.color})` : "none" }}
                    >
                      <animate attributeName="r" values={`${isActive ? 8 : 6};${isActive ? 10 : 8};${isActive ? 8 : 6}`} dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="5" fill="white" fontWeight="bold">
                      {agent.icon}
                    </text>
                    <text
                      x={pos.x}
                      y={pos.y + (i < 2 ? -12 : 14)}
                      textAnchor="middle"
                      fontSize="4"
                      fill={agent.color}
                      fontWeight="bold"
                    >
                      {agent.label.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Click an agent node to inspect</p>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENTS.map((agent) => {
            const isActive = activeAgent === agent.id;
            return (
              <div
                key={agent.id}
                className={`rounded-xl border transition-all duration-200 cursor-pointer ${isActive ? agent.colorClass : "border-border/40 bg-card/50 hover:border-border/70"}`}
                onClick={() => setActiveAgent(isActive ? null : agent.id)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: `${agent.color}20`, border: `2px solid ${agent.color}60`, boxShadow: isActive ? `0 0 12px ${agent.color}50` : "none" }}
                    >
                      {agent.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm" style={{ color: agent.color }}>{agent.label} Agent</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-blink" />
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${agent.confidence}%`, background: agent.color }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color: agent.color }}>{agent.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <p className="text-xs text-foreground/70 mb-3 leading-relaxed">{agent.desc}</p>
                  )}

                  <div className="grid grid-cols-2 gap-1.5">
                    {agent.metrics.map((m) => (
                      <div key={m.label} className="rounded-lg p-2" style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}20` }}>
                        <div className="text-xs text-muted-foreground">{m.label}</div>
                        <div className={`text-sm font-mono font-bold ${m.status === "warning" ? "text-amber-400" : m.status === "critical" ? "text-red-400" : "text-foreground"}`}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent agent logs */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Agent Activity Log</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {(logs ?? []).map((log, i) => {
              const agent = AGENTS.find(a => a.id === log.agentId);
              return (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono uppercase shrink-0"
                    style={{ color: agent?.color, background: `${agent?.color}15` }}
                  >
                    {log.agentId}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground/80">{log.action}</p>
                    {log.details && <p className="text-xs text-muted-foreground truncate">{log.details}</p>}
                    {log.hasConflict && (
                      <p className="text-xs text-amber-400">⚡ Conflict → {log.conflictResolution}</p>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{(log.confidence * 100).toFixed(0)}%</span>
                </div>
              );
            })}
            {(!logs || logs.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">No activity logs yet</p>
            )}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
