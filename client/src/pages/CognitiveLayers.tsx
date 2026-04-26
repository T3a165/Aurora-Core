import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { useState } from "react";
import { ChevronDown, Activity, Cpu, BrainCircuit, BarChart3, Settings2, Zap, RefreshCw } from "lucide-react";

const LAYERS = [
  {
    id: "bio",
    n: 1,
    label: "Bio",
    fullLabel: "Biological & Environmental Inputs",
    color: "#22c55e",
    colorClass: "text-green-400 border-green-500/40 bg-green-500/10",
    glowClass: "aurora-glow-green",
    icon: Activity,
    desc: "Ingests raw data from wearables (HR, HRV, sleep, stress, SpO₂), air quality sensors, weather feeds, utility grid signals, and occupancy detection.",
    details: [
      "Apple Watch / Oura Ring / Garmin biometric streams",
      "CO₂, PM2.5, humidity, temperature, lux, UV sensors",
      "Green Button energy data & smart meter feeds",
      "Occupancy detection via ESP32 mesh network",
      "Weather API integration for predictive pre-conditioning",
    ],
    status: "Active",
    throughput: "1.2k signals/min",
  },
  {
    id: "ingest",
    n: 2,
    label: "Ingest",
    fullLabel: "Signal Ingestion & Normalization",
    color: "#3b82f6",
    colorClass: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    glowClass: "aurora-glow-cyan",
    icon: Cpu,
    desc: "Filters and pre-processes all incoming signals to ensure temporal and spatial consistency across heterogeneous data sources.",
    details: [
      "Open Wearables API normalization engine",
      "ESP32-C6 mesh network signal aggregation",
      "Cross-domain feature normalization (biometric ↔ energy)",
      "Temporal alignment of multi-rate sensor streams",
      "Anomaly detection and outlier filtering",
    ],
    status: "Active",
    throughput: "98.7% uptime",
  },
  {
    id: "cognitive",
    n: 3,
    label: "Cognitive Core",
    fullLabel: "Cognitive Core — Multi-Agent AI Field",
    color: "#a855f7",
    colorClass: "text-purple-400 border-purple-500/40 bg-purple-500/10",
    glowClass: "aurora-glow-purple",
    icon: BrainCircuit,
    desc: "Four specialized AI agents (Health, Energy, Behavior, Environment) share weighted state vectors in real-time, enabling collaborative reasoning with conflict resolution.",
    details: [
      "Health Agent: biometric monitoring & hardware diagnostics",
      "Energy Agent: peak-load optimization & demand response",
      "Behavior Agent: routine pattern learning & preference encoding",
      "Environment Agent: air quality, weather & occupancy tracking",
      "LangGraph/AutoGen inter-agent communication framework",
    ],
    status: "Active",
    throughput: "4 agents · 94% consensus",
  },
  {
    id: "predict",
    n: 4,
    label: "Predictive",
    fullLabel: "Predictive Simulation Engine",
    color: "#f59e0b",
    colorClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    glowClass: "aurora-glow-amber",
    icon: BarChart3,
    desc: "Runs multi-horizon forecasts using Temporal Fusion Transformers and Monte Carlo scenario modeling for probability-weighted multi-domain optimization.",
    details: [
      "Monte Carlo scenario modeling (1000+ simulations/cycle)",
      "Temporal Fusion Transformer for time-series forecasting",
      "Probability-weighted optimization across comfort, cost, health",
      "Seasonal adaptation & occupancy pattern learning",
      "3 active scenarios: Peak Shave, Grid Response, Wellness Priority",
    ],
    status: "Active",
    throughput: "3 scenarios active",
  },
  {
    id: "decide",
    n: 5,
    label: "Decision",
    fullLabel: "Decision & Orchestration Engine",
    color: "#ef4444",
    colorClass: "text-red-400 border-red-500/40 bg-red-500/10",
    glowClass: "aurora-glow-red",
    icon: Settings2,
    desc: "Synthesizes agent outputs into conflict-resolved, high-level action plans using priority weighting, constraint satisfaction, and user preference learning.",
    details: [
      "Priority weighting across health, energy, comfort, cost",
      "Constraint satisfaction for safety-critical operations",
      "Action plan generation with rollback capabilities",
      "User preference learning from manual overrides",
      "Override management & safety fallback protocols",
    ],
    status: "Active",
    throughput: "12 decisions/hr",
  },
  {
    id: "execute",
    n: 6,
    label: "Execution",
    fullLabel: "Execution Layer",
    color: "#06b6d4",
    colorClass: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    glowClass: "aurora-glow-cyan",
    icon: Zap,
    desc: "Translates orchestrated plans into physical device commands via Matter 1.5 / Thread / BLE 5.3, controlling TurnBot actuators and managing energy dispatch.",
    details: [
      "Matter 1.5 / Thread / BLE 5.3 device control (ESP32-C6)",
      "TurnBot Mini, Pro, Hub actuator integration",
      "OpenADR 2.0b demand response protocol",
      "HVAC, EV charging, battery dispatch control",
      "PID control loops with AS5600 encoder feedback",
    ],
    status: "Active",
    throughput: "3 devices active",
  },
  {
    id: "loop",
    n: 7,
    label: "Optimization Loop",
    fullLabel: "Continuous Optimization Loop",
    color: "#ec4899",
    colorClass: "text-pink-400 border-pink-500/40 bg-pink-500/10",
    glowClass: "",
    icon: RefreshCw,
    desc: "Closes the feedback loop by ingesting execution outcomes, retraining models, tracking performance scores, and adapting to seasonal and behavioral changes.",
    details: [
      "Feedback ingestion from all execution outcomes",
      "Continuous model retraining via online learning",
      "Seasonal adaptation & drift detection",
      "Performance scoring & energy savings tracking",
      "A/B testing of competing action strategies",
    ],
    status: "Active",
    throughput: "Continuous",
  },
];

export default function CognitiveLayers() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Seven-Layer Cognitive Architecture</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Interactive stack visualization — click any layer to expand</p>
        </div>

        {/* Continuous feedback indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 w-fit">
          <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-mono text-cyan-400 tracking-wider">CONTINUOUS FEEDBACK LOOP ACTIVE</span>
        </div>

        {/* Layer stack */}
        <div className="space-y-2">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <div
                key={layer.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${isActive ? layer.colorClass : "border-border/40 bg-card/50 hover:border-border/70"}`}
              >
                <button
                  className="w-full flex items-center gap-3 p-4 text-left"
                  onClick={() => setActiveLayer(isActive ? null : layer.id)}
                >
                  {/* Layer number */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all"
                    style={{
                      background: isActive ? layer.color : "transparent",
                      border: `2px solid ${layer.color}`,
                      color: isActive ? "#fff" : layer.color,
                      boxShadow: isActive ? `0 0 12px ${layer.color}60` : "none",
                    }}
                  >
                    {layer.n}
                  </div>

                  {/* Icon */}
                  <Icon className="h-4 w-4 shrink-0" style={{ color: layer.color }} />

                  {/* Labels */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider" style={{ color: layer.color }}>
                        L{layer.n}
                      </span>
                      <span className="text-sm font-semibold text-foreground truncate">{layer.fullLabel}</span>
                    </div>
                    {!isActive && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{layer.desc.substring(0, 80)}...</p>
                    )}
                  </div>

                  {/* Status + throughput */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono" style={{ color: layer.color }}>{layer.throughput}</div>
                      <div className="flex items-center gap-1 justify-end">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-blink" />
                        <span className="text-xs text-green-400">{layer.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chevron */}
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300"
                    style={{ transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {/* Expanded content */}
                {isActive && (
                  <div className="px-4 pb-4 border-t border-current/20 pt-3">
                    <p className="text-sm text-foreground/80 mb-3 leading-relaxed">{layer.desc}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {layer.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: layer.color }} />
                          <span className="text-xs text-foreground/70">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Architecture summary */}
        <div className="rounded-xl border border-border/40 bg-card/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Architecture Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Layers", value: "7", color: "text-purple-400" },
              { label: "AI Agents", value: "4", color: "text-cyan-400" },
              { label: "Data Sources", value: "12+", color: "text-green-400" },
              { label: "Protocols", value: "Matter 1.5, Thread, BLE 5.3", color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
