import AuroraDashboardLayout from "@/components/AuroraDashboardLayout";
import { trpc } from "@/lib/trpc";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Cpu, BarChart3, TrendingUp, Heart, Zap, RefreshCw, SlidersHorizontal, Play, RotateCcw, ChevronDown, ChevronUp, Brain, Loader2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const SCENARIOS = [
  {
    id: "peak-shave",
    name: "Peak Shave",
    icon: Zap,
    color: "#f59e0b",
    colorClass: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    probability: 87,
    savings: 47,
    desc: "Shift high-load appliances (HVAC, EV charger) to off-peak hours (10pm–6am). Battery dispatches during 3–8pm peak tariff window.",
    tradeoffs: "Comfort: Minor delay in EV charging. Health: Neutral. Grid: High benefit.",
    radarData: [
      { metric: "Cost Savings", value: 92 },
      { metric: "Comfort", value: 72 },
      { metric: "Health", value: 80 },
      { metric: "Grid Benefit", value: 95 },
      { metric: "Battery Life", value: 78 },
    ],
  },
  {
    id: "grid-response",
    name: "Grid Response",
    icon: BarChart3,
    color: "#3b82f6",
    colorClass: "text-blue-400 border-blue-500/40 bg-blue-500/10",
    probability: 73,
    savings: 62,
    desc: "Respond to utility OpenADR 2.0b demand response events. Curtail load by up to 30% during grid stress events, earning utility incentives.",
    tradeoffs: "Comfort: Moderate HVAC setback. Health: Monitor temperature. Grid: Maximum benefit.",
    radarData: [
      { metric: "Cost Savings", value: 85 },
      { metric: "Comfort", value: 60 },
      { metric: "Health", value: 70 },
      { metric: "Grid Benefit", value: 98 },
      { metric: "Battery Life", value: 65 },
    ],
  },
  {
    id: "wellness-priority",
    name: "Wellness Priority",
    icon: Heart,
    color: "#ef4444",
    colorClass: "text-red-400 border-red-500/40 bg-red-500/10",
    probability: 91,
    savings: 18,
    desc: "Prioritize occupant health and comfort. Maintain optimal air quality (CO₂ < 800ppm), temperature (68–74°F), and sleep environment. Energy cost secondary.",
    tradeoffs: "Comfort: Maximum. Health: Optimal. Grid: Low contribution. Cost: Higher energy use.",
    radarData: [
      { metric: "Cost Savings", value: 35 },
      { metric: "Comfort", value: 98 },
      { metric: "Health", value: 99 },
      { metric: "Grid Benefit", value: 30 },
      { metric: "Battery Life", value: 85 },
    ],
  },
];

const DEFAULT_PARAMS = {
  confidenceThreshold: 75,
  savingsTarget: 50,
  priorityWeights: {
    cost: 70,
    comfort: 60,
    health: 80,
    grid: 50,
    batteryLife: 65,
  },
};

export default function Simulation() {
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [showTuning, setShowTuning] = useState(false);
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [selectedScenarioForParams, setSelectedScenarioForParams] = useState<string>("peak-shave");
  const [paramResult, setParamResult] = useState<string | null>(null);

  const analyzeMutation = trpc.simulation.analyze.useMutation({
    onSuccess: (data, variables) => {
      const analysisText = typeof data.analysis === "string" ? data.analysis : String(data.analysis);
      setAnalysis(prev => ({ ...prev, [variables.scenario]: analysisText }));
    },
    onError: () => toast.error("Analysis failed"),
  });

  const analyzeWithParamsMutation = trpc.simulation.analyzeWithParams.useMutation({
    onSuccess: (data) => {
      const content = typeof data.analysis === "string" ? data.analysis : "Analysis unavailable.";
      setParamResult(content);
    },
    onError: () => toast.error("Parameterized analysis failed"),
  });

  const runParameterizedAnalysis = useCallback(() => {
    const scenario = SCENARIOS.find(s => s.id === selectedScenarioForParams);
    if (!scenario) return;
    setParamResult(null);
    analyzeWithParamsMutation.mutate({
      scenario: scenario.name,
      confidenceThreshold: params.confidenceThreshold,
      savingsTarget: params.savingsTarget,
      priorityWeights: params.priorityWeights,
    });
  }, [analyzeWithParamsMutation, selectedScenarioForParams, params]);

  const updateWeight = (key: keyof typeof DEFAULT_PARAMS.priorityWeights, value: number[]) => {
    setParams(p => ({ ...p, priorityWeights: { ...p.priorityWeights, [key]: value[0] } }));
  };

  const scenario = SCENARIOS.find(s => s.id === activeScenario);

  return (
    <AuroraDashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Predictive Simulation Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monte Carlo scenario modeling with probability-weighted optimization</p>
        </div>

        {/* Engine status */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-purple-500/20 bg-purple-500/5">
          <Cpu className="h-4 w-4 text-purple-400 animate-pulse" />
          <span className="text-xs font-mono text-purple-400">MONTE CARLO ENGINE ACTIVE · 1,000+ SIMULATIONS/CYCLE</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 status-blink" />
            <span className="text-xs text-green-400">TFT MODEL v2.1</span>
          </div>
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-1 gap-4">
          {SCENARIOS.map((sc) => {
            const Icon = sc.icon;
            const isActive = activeScenario === sc.id;
            const hasAnalysis = !!analysis[sc.name];
            return (
              <div
                key={sc.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${isActive ? sc.colorClass : "border-border/40 bg-card/50 hover:border-border/70"}`}
              >
                {/* Card header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setActiveScenario(isActive ? null : sc.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${sc.color}20`, border: `2px solid ${sc.color}50`, boxShadow: isActive ? `0 0 12px ${sc.color}40` : "none" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: sc.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{sc.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>
                          {sc.probability}% likely
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{sc.desc.substring(0, 70)}...</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-bold font-mono" style={{ color: sc.color }}>${sc.savings}/mo</div>
                      <div className="text-xs text-muted-foreground">est. savings</div>
                    </div>
                  </div>

                  {/* Probability bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Probability Score</span>
                      <span className="text-xs font-mono" style={{ color: sc.color }}>{sc.probability}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${sc.probability}%`, background: sc.color, boxShadow: `0 0 6px ${sc.color}60` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded content */}
                {isActive && (
                  <div className="px-4 pb-4 border-t border-current/10 pt-3 space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed">{sc.desc}</p>
                    <p className="text-xs text-muted-foreground italic">{sc.tradeoffs}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Radar chart */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Multi-Domain Score</h3>
                        <ResponsiveContainer width="100%" height={180}>
                          <RadarChart data={sc.radarData}>
                            <PolarGrid stroke="#333" />
                            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: "#888" }} />
                            <Tooltip
                              contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: "6px", fontSize: "11px" }}
                            />
                            <Radar dataKey="value" stroke={sc.color} fill={sc.color} fillOpacity={0.2} strokeWidth={1.5} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* AI Analysis */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground mb-2">AI Analysis</h3>
                        {hasAnalysis ? (
                          <div className="rounded-lg border border-border/30 bg-background/50 p-3">
                            <p className="text-xs text-foreground/80 leading-relaxed">{analysis[sc.name]}</p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-border/30 bg-background/50 p-3 flex flex-col items-center gap-2">
                            <TrendingUp className="h-6 w-6 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground text-center">Run AI analysis for detailed scenario assessment</p>
                            <Button
                              size="sm"
                              className="text-white text-xs"
                              style={{ background: sc.color }}
                              disabled={analyzeMutation.isPending}
                              onClick={() => analyzeMutation.mutate({ scenario: sc.name })}
                            >
                              {analyzeMutation.isPending ? (
                                <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Analyzing...</>
                              ) : "Run Analysis"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Monte Carlo Parameter Tuning (v2) ── */}
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-purple-500/10 transition-colors"
            onClick={() => setShowTuning(!showTuning)}
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-foreground text-sm">Monte Carlo Parameter Tuning</span>
              <span className="text-xs text-purple-400 font-mono px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">v2</span>
            </div>
            {showTuning ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showTuning && (
            <div className="px-4 pb-4 space-y-5 border-t border-purple-500/20">
              <p className="text-xs text-muted-foreground pt-3">
                Adjust simulation parameters to customize how Aurora Core weighs tradeoffs. The LLM analysis will incorporate your exact settings, including confidence threshold, savings target, and priority weights.
              </p>

              {/* Scenario selector */}
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-2">Target Scenario</label>
                <div className="flex gap-2 flex-wrap">
                  {SCENARIOS.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedScenarioForParams(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                        selectedScenarioForParams === s.id
                          ? "border-current/60 bg-current/15"
                          : "border-border/30 text-muted-foreground hover:border-border/60"
                      }`}
                      style={selectedScenarioForParams === s.id ? { color: s.color } : {}}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence threshold */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground/80">Confidence Threshold</label>
                  <span className="text-xs font-mono text-purple-400">{params.confidenceThreshold}%</span>
                </div>
                <Slider
                  min={50} max={99} step={1}
                  value={[params.confidenceThreshold]}
                  onValueChange={v => setParams(p => ({ ...p, confidenceThreshold: v[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Only recommend actions with confidence above this threshold.</p>
              </div>

              {/* Savings target */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground/80">Monthly Savings Target</label>
                  <span className="text-xs font-mono text-green-400">${params.savingsTarget}</span>
                </div>
                <Slider
                  min={10} max={500} step={5}
                  value={[params.savingsTarget]}
                  onValueChange={v => setParams(p => ({ ...p, savingsTarget: v[0] }))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">Target monthly energy savings in USD.</p>
              </div>

              {/* Priority weights */}
              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-3">Priority Weights</label>
                <div className="space-y-3">
                  {(
                    [
                      { key: "cost",        label: "Cost Savings",  color: "#f59e0b" },
                      { key: "comfort",     label: "Comfort",       color: "#06b6d4" },
                      { key: "health",      label: "Health",        color: "#a855f7" },
                      { key: "grid",        label: "Grid Benefit",  color: "#22c55e" },
                      { key: "batteryLife", label: "Battery Life",  color: "#f97316" },
                    ] as const
                  ).map(({ key, label, color }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                      <div className="flex-1">
                        <Slider
                          min={0} max={100} step={5}
                          value={[params.priorityWeights[key]]}
                          onValueChange={v => updateWeight(key, v)}
                          className="w-full"
                        />
                      </div>
                      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{params.priorityWeights[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold flex-1"
                  onClick={runParameterizedAnalysis}
                  disabled={analyzeWithParamsMutation.isPending}
                >
                  {analyzeWithParamsMutation.isPending ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running simulation...</>
                  ) : (
                    <><Play className="h-3.5 w-3.5 mr-1.5" /> Run Parameterized Analysis</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border/40 text-muted-foreground"
                  onClick={() => { setParams(DEFAULT_PARAMS); setParamResult(null); }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>

              {/* Parameterized result */}
              {(analyzeWithParamsMutation.isPending || paramResult) && (
                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-3.5 w-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400">
                      {SCENARIOS.find(s => s.id === selectedScenarioForParams)?.name} — Custom Parameters
                    </span>
                  </div>
                  {analyzeWithParamsMutation.isPending ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                      <span className="text-xs">Monte Carlo engine processing your parameters...</span>
                    </div>
                  ) : paramResult ? (
                    <div className="text-xs text-foreground/80 prose prose-sm prose-invert max-w-none">
                      <Streamdown>{paramResult}</Streamdown>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Simulation summary */}
        <div className="rounded-xl border border-border/40 bg-card p-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Simulation Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xl font-bold font-mono text-purple-400">1,247</div>
              <div className="text-xs text-muted-foreground">Simulations Run</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-cyan-400">3</div>
              <div className="text-xs text-muted-foreground">Active Scenarios</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-green-400">$127</div>
              <div className="text-xs text-muted-foreground">Max Monthly Savings</div>
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-amber-400">TFT v2.1</div>
              <div className="text-xs text-muted-foreground">Forecast Model</div>
            </div>
          </div>
        </div>
      </div>
    </AuroraDashboardLayout>
  );
}
