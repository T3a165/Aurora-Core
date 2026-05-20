import type { InstallationState, Mode, ScoreBreakdown, Signal, DecisionResult } from "./types.js";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// ---- Sub-scores (each 0..100, higher = better) ------------------------------

export function energyScore(s: InstallationState["energy"]) {
  // Reward: solar coverage of load + healthy battery + cheap tariff
  const coverage = s.loadW <= 0 ? 1 : Math.min(1, s.solarW / s.loadW);
  const battery  = clamp(s.batterySoc, 0, 100) / 100;
  const tariff   = s.gridPriceCents <= 10 ? 1 : s.gridPriceCents >= 40 ? 0 : (40 - s.gridPriceCents) / 30;
  return Math.round(clamp((coverage * 50 + battery * 30 + tariff * 20)));
}

export function bioScore(s: InstallationState["bio"]) {
  // Conservative, non-medical: penalize high HR, low HRV, high stress.
  const hrPenalty   = s.hr > 100 ? (s.hr - 100) * 1.2 : s.hr < 50 ? (50 - s.hr) * 1.2 : 0;
  const hrvPenalty  = s.hrv < 40 ? (40 - s.hrv) * 1.5 : 0;
  const stress      = clamp(s.stress, 0, 100);
  return Math.round(clamp(100 - hrPenalty - hrvPenalty - stress * 0.4));
}

export function envScore(s: InstallationState["env"]) {
  const temp = s.tempC < 18 || s.tempC > 26 ? 60 : 100;
  const hum  = s.humidity < 30 || s.humidity > 60 ? 70 : 100;
  const co2  = s.co2Ppm > 1500 ? 30 : s.co2Ppm > 1000 ? 65 : 100;
  const pm   = s.pm25 > 35 ? 30 : s.pm25 > 15 ? 70 : 100;
  return Math.round((temp + hum + co2 + pm) / 4);
}

// ---- Mode weights -----------------------------------------------------------

const WEIGHTS: Record<Mode, [number, number, number]> = {
  energy_guardian:    [0.6, 0.15, 0.25],
  health_sentinel:    [0.15, 0.6,  0.25],
  habitat_optimizer:  [0.33, 0.33, 0.34],
};

// ---- Signals + actions ------------------------------------------------------

export function deriveSignals(s: InstallationState, mode: Mode): Signal[] {
  const out: Signal[] = [];
  if (s.energy.gridPriceCents >= 35 && s.energy.batterySoc < 30) {
    out.push({ kind: "energy.peak_tariff", severity: "warn",
      message: "Peak tariff with low battery reserve",
      recommendation: "Delay high-draw appliances for ~90 min" });
  }
  if (s.bio.stress >= 70) {
    out.push({ kind: "bio.high_strain", severity: "alert",
      message: "Sustained high stress detected (non-medical)",
      recommendation: "Dim lights, lower setpoint by 1°C, suggest break" });
  }
  if (s.env.co2Ppm > 1500) {
    out.push({ kind: "env.co2", severity: "alert",
      message: `CO₂ at ${Math.round(s.env.co2Ppm)} ppm`,
      recommendation: "Increase ventilation" });
  }
  if (s.env.pm25 > 35) {
    out.push({ kind: "env.pm25", severity: "warn",
      message: `PM2.5 elevated (${s.env.pm25} µg/m³)`,
      recommendation: "Run air purifier" });
  }
  if (mode === "energy_guardian" && s.energy.solarW > s.energy.loadW * 1.3 && s.energy.batterySoc < 90) {
    out.push({ kind: "energy.surplus", severity: "info",
      message: "Solar surplus available",
      recommendation: "Charge battery / pre-cool habitat" });
  }
  return out;
}

export function deriveActions(s: InstallationState, mode: Mode) {
  const acts: DecisionResult["actions"] = [];
  if (s.env.co2Ppm > 1500) acts.push({ deviceKind: "hvac", command: "set_ventilation", args: { level: "high" }, reason: "co2_high" });
  if (s.env.pm25 > 35)     acts.push({ deviceKind: "hvac", command: "set_purifier",    args: { on: true },        reason: "pm25_high" });
  if (s.bio.stress >= 70)  acts.push({ deviceKind: "light", command: "dim",            args: { level: 30 },       reason: "bio_strain" });
  if (mode === "energy_guardian" && s.energy.gridPriceCents >= 35) {
    acts.push({ deviceKind: "turnbot", command: "delay_load", args: { minutes: 90 }, reason: "peak_tariff" });
  }
  return acts;
}

export function decide(state: InstallationState, mode: Mode): DecisionResult {
  const e = energyScore(state.energy);
  const b = bioScore(state.bio);
  const v = envScore(state.env);
  const [we, wb, wv] = WEIGHTS[mode];
  const score = Math.round(clamp(e * we + b * wb + v * wv));
  const breakdown: ScoreBreakdown = { energy: e, biometric: b, environment: v, mode };
  return { score, breakdown, signals: deriveSignals(state, mode), actions: deriveActions(state, mode) };
}
