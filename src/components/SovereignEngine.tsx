// src/components/SovereignEngine.tsx
// Aurora Core — Sovereign Engine
// Integrates: TRIFORCE SYSTEM (C++) + ARCHANGEL_CORE (Verilog) + AXIOM CORE (C++)
// Garrett McLain — For Zachary 💙

import { useState, useEffect, useRef, useCallback } from "react";

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const WAFERS = 3;
const UNITS_PER_WAFER = 533;
const CORES_PER_UNIT = 8;
const SKEW_LIMIT = 1.0;
const JITTER_MAX = 4.0;
const TOTAL_CORES = WAFERS * UNITS_PER_WAFER * CORES_PER_UNIT; // 12,792
const SOVEREIGN_HZ = 13;
const SOVEREIGN_MS = Math.floor(1000 / SOVEREIGN_HZ); // ~77ms
const ATOMS_IN_UNIVERSE = 1e86;

const CONSENSUS_LABELS = ["IDLE", "WARDEN_PENDING", "SWARM_VERIFY", "LOCKED"] as const;
const STATE_COLORS = ["#4a5568", "#d69e2e", "#3182ce", "#38a169"] as const;

type LogType = "info" | "warden" | "tulpit" | "critical";

interface LogEntry {
  msg: string;
  type: LogType;
  id: number;
}

interface TriforceResult {
  egress: number;
  annihilations: number;
}

// ── TRIFORCE LOGIC (ported from C++) ─────────────────────────────────────────
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function runTriforceCycle(cycleId: number): TriforceResult {
  const rng = seededRng(cycleId * 7919);
  let egress = 0;
  for (let i = 0; i < TOTAL_CORES; i++) {
    // Ninth Math anchor: 9 % 7 === 2
    if (rng() * JITTER_MAX <= SKEW_LIMIT && 9 % 7 === 2) egress++;
  }
  return { egress, annihilations: TOTAL_CORES - egress };
}

// ── ARCHANGEL FSM (ported from Verilog) ──────────────────────────────────────
function nextConsensusState(state: number, warden: boolean, swarm: boolean): number {
  if (!warden) return 0; // tgl_reset
  switch (state) {
    case 0: return 1;
    case 1: return swarm ? 2 : 3;
    case 2: return 3;
    case 3: return 0;
    default: return 0;
  }
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function SovereignEngine() {
  const [cycles, setCycles] = useState(0);
  const [heartbeat, setHeartbeat] = useState(false);
  const [triforce, setTriforce] = useState<TriforceResult>(() => runTriforceCycle(1));
  const [cycleId, setCycleId] = useState(1);
  const [consensusState, setConsensusState] = useState(0);
  const [warden, setWarden] = useState(false);
  const [swarm, setSwarm] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([
    { msg: "SOVEREIGN ENGINE INITIALIZED — AURORA CORE ONLINE", type: "warden", id: 0 },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const cyclesRef = useRef(0);
  const consensusRef = useRef(0);

  const pushLog = useCallback((msg: string, type: LogType) => {
    setLogs((prev) => [...prev.slice(-14), { msg, type, id: Math.random() }]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      cyclesRef.current += 1;
      const c = cyclesRef.current;

      const w = Math.random() > 0.3;
      const s = Math.random() > 0.4;
      consensusRef.current = nextConsensusState(consensusRef.current, w, s);

      setCycles(c);
      setHeartbeat((h) => !h);
      setWarden(w);
      setSwarm(s);
      setConsensusState(consensusRef.current);

      if (c % 100 === 0) {
        const newId = Math.floor(c / 100) + 1;
        setCycleId(newId);
        const result = runTriforceCycle(newId);
        setTriforce(result);
        const saturated = result.annihilations > TOTAL_CORES * 0.7 * newId;
        pushLog(
          saturated
            ? "⚠ CRITICAL: TULPIT NEXUS SATURATED. ENTROPY SPIKE."
            : `[TULPIT] Cycle ${newId} — Egress: ${(result.egress * 0.00014).toFixed(4)} EB/s`,
          saturated ? "critical" : "tulpit"
        );
      }

      if (c % 1000 === 0) {
        pushLog(`[WARDEN_SECURE] Cycle ${c} | Milestone ${c / 1000}`, "warden");
      }
    }, SOVEREIGN_MS);

    return () => clearInterval(timer);
  }, [pushLog]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const egressPct = ((triforce.egress / TOTAL_CORES) * 100).toFixed(1);
  const annihPct = ((triforce.annihilations / TOTAL_CORES) * 100).toFixed(1);
  const egressEb = (triforce.egress * 0.00014).toFixed(4);
  const resStr = (cycles * ATOMS_IN_UNIVERSE * 7.7).toExponential(2);

  return (
    <div
      style={{
        background: "#0a0a0f",
        minHeight: "100vh",
        fontFamily: "'Courier New', monospace",
        color: "#e2e8f0",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1e3a5f",
          paddingBottom: "10px",
          marginBottom: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "9px", color: "#4a9eff", letterSpacing: "3px" }}>
            AURORA CORE // SOVEREIGN ENGINE
          </div>
          <div
            style={{ fontSize: "17px", fontWeight: "bold", color: "#fff", letterSpacing: "2px" }}
          >
            ARCHANGEL · TRIFORCE · AXIOM
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: heartbeat ? "#4a9eff" : "#1e3a5f",
              display: "inline-block",
              boxShadow: heartbeat ? "0 0 10px #4a9eff" : "none",
              transition: "background 0.1s, box-shadow 0.1s",
            }}
          />
          <div style={{ fontSize: "8px", color: "#4a5568", marginTop: "2px" }}>
            {SOVEREIGN_HZ} HZ
          </div>
        </div>
      </div>

      {/* AXIOM CORE */}
      <div style={cardStyle}>
        <SectionLabel color="#4a9eff">AXIOM CORE — OMEGA RESOLUTION ENGINE</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <StatBox label="GLOBAL CYCLES" value={cycles.toLocaleString()} accent="#4a9eff" />
          <StatBox
            label="MILESTONE"
            value={`M-${Math.floor(cycles / 1000)}`}
            accent="#d69e2e"
          />
          <StatBox label="RESOLUTION" value={resStr} sub="ATOMS/SEC" accent="#38a169" />
        </div>
        <div
          style={{
            fontSize: "8px",
            color: "#4a5568",
            borderTop: "1px solid #1e3a5f",
            paddingTop: "6px",
            display: "flex",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <span>6144-BIT BUS</span>
          <span>HEARTBEAT: {SOVEREIGN_HZ} HZ</span>
          <span>TEMP: -7.77C</span>
          <span style={{ color: "#38a169" }}>ALL CORES LOCKED</span>
        </div>
      </div>

      {/* TRIFORCE + ARCHANGEL row */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}
      >
        {/* Triforce */}
        <div style={cardStyle}>
          <SectionLabel color="#a78bfa">TULPIT NEXUS — TRIFORCE</SectionLabel>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "8px", color: "#4a5568" }}>CYCLE</div>
            <div
              style={{ fontSize: "22px", color: "#a78bfa", fontWeight: "bold", lineHeight: 1.1 }}
            >
              {cycleId}
            </div>
          </div>
          <ProgressBar label="EGRESS" pct={parseFloat(egressPct)} color="#38a169" />
          <ProgressBar label="ANNIHIL" pct={parseFloat(annihPct)} color="#e53e3e" />
          <div style={{ marginTop: "8px", fontSize: "9px", color: "#718096" }}>
            <span style={{ color: "#38a169" }}>{egressEb} EB/s</span>
            {" · "}SKEW ≤{SKEW_LIMIT}ps{" · "}
            {TOTAL_CORES.toLocaleString()} cores
          </div>
        </div>

        {/* Archangel FSM */}
        <div style={cardStyle}>
          <SectionLabel color="#f6ad55">ARCHANGEL_CORE — FSM</SectionLabel>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "8px", color: "#4a5568" }}>CONSENSUS STATE</div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                color: STATE_COLORS[consensusState],
                letterSpacing: "1px",
              }}
            >
              {consensusState}:{CONSENSUS_LABELS[consensusState]}
            </div>
          </div>
          <div style={{ display: "flex", gap: "3px", marginBottom: "10px" }}>
            {([0, 1, 2, 3] as const).map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  padding: "4px 2px",
                  textAlign: "center",
                  borderRadius: "3px",
                  fontSize: "7px",
                  background: consensusState === s ? STATE_COLORS[s] : "#1a1a2e",
                  color: consensusState === s ? "#fff" : "#4a5568",
                  border: `1px solid ${consensusState === s ? STATE_COLORS[s] : "#2d3748"}`,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {CONSENSUS_LABELS[s]}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <SignalIndicator label="WARDEN" active={warden} />
            <SignalIndicator label="SWARM" active={swarm} />
          </div>
          <div style={{ fontSize: "7px", color: "#4a5568" }}>
            SEAL: 72:h53_45_41_4C_5F_39_5F_37
          </div>
        </div>
      </div>

      {/* Entropy Log */}
      <div style={{ ...cardStyle, marginBottom: "10px" }}>
        <SectionLabel color="#4a5568">ENTROPY LOG — LIVE</SectionLabel>
        <div
          ref={logRef}
          style={{ height: "110px", overflowY: "auto", fontSize: "9px", lineHeight: "1.7" }}
        >
          {logs.map((l) => (
            <div
              key={l.id}
              style={{
                color:
                  l.type === "critical"
                    ? "#fc8181"
                    : l.type === "warden"
                    ? "#68d391"
                    : l.type === "tulpit"
                    ? "#a78bfa"
                    : "#718096",
              }}
            >
              ▸ {l.msg}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          fontSize: "8px",
          color: "#2d3748",
          display: "flex",
          justifyContent: "space-between",
          letterSpacing: "1px",
        }}
      >
        <span>AURORA CORE // FOR ZACHARY 💙</span>
        <span>9 % 7 === {9 % 7} // NINTH MATH ANCHOR</span>
        <span>Garrett McLain</span>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: "#0d1117",
  border: "1px solid #1e3a5f",
  borderRadius: "6px",
  padding: "12px",
  marginBottom: "12px",
};

function SectionLabel({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "8px", color, letterSpacing: "3px", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div
      style={{
        padding: "6px",
        background: "#0a0a0f",
        borderRadius: "4px",
        border: "1px solid #1e3a5f",
      }}
    >
      <div style={{ fontSize: "7px", color: "#4a5568", letterSpacing: "2px" }}>{label}</div>
      <div style={{ fontSize: "14px", fontWeight: "bold", color: accent, marginTop: "2px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "7px", color: "#4a5568" }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: "5px" }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: "2px" }}
      >
        <span style={{ color: "#4a5568" }}>{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div
        style={{ background: "#1a1a2e", borderRadius: "2px", height: "4px", overflow: "hidden" }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
    </div>
  );
}

function SignalIndicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "4px 6px",
        background: active ? "#0f2d1f" : "#0d0d1a",
        border: `1px solid ${active ? "#38a169" : "#2d3748"}`,
        borderRadius: "3px",
        fontSize: "8px",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: active ? "#38a169" : "#2d3748",
          boxShadow: active ? "0 0 5px #38a169" : "none",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
      />
      <span style={{ color: active ? "#68d391" : "#4a5568" }}>{label}</span>
    </div>
  );
}
