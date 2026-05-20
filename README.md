# Aurora Core v2.0
![License: ACOS‑NCOL](https://img.shields.io/badge/License-ACOS--NCOL-blue.svg)
![Non‑Commercial](https://img.shields.io/badge/Use-Non--Commercial-red.svg)
![Made by Garrett](https://img.shields.io/badge/Made_by-Garrett_McLain-black.svg)

> **Seven-layer cognitive-energy ecosystem** — built entirely on an iPhone 16 Pro Max, by Garrett McLain, for his son Zachary Lee McLain (born April 13, 2026).

[![Live Demo](https://img.shields.io/badge/Live%20Demo-aurora--core--3j6h.vercel.app-00ffc8?style=flat-square)](https://aurora-core-3j6h.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-9b5de5?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square)](https://typescriptlang.org)
[![TurnBot Patent](https://img.shields.io/badge/TurnBot-USPTO%20%2364%2F022%2C558-ffd60a?style=flat-square)](https://turnbot.org)

---

## What Is Aurora Core?

Aurora Core is not a dashboard. It is a **closed-loop AI platform** that merges:

- **Human biology** (HRV, SpO₂, stress, sleep)
- **Home energy infrastructure** (solar, battery, grid, circuits)
- **Physical device control** (TurnBot actuators via Matter 1.5 / BLE)
- **Predictive intelligence** (Monte Carlo simulation, agent consensus)

All seven cognitive layers run continuously — ingesting signals, reasoning about tradeoffs, and taking real-world action through TurnBot hardware.

---

## Live Demo

**[aurora-core-3j6h.vercel.app](https://aurora-core-3j6h.vercel.app)**

Sign up for an account or use the demo. God Mode: `garrettmclain96@gmail.com`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AURORA CORE v2.0                          │
│              7-Layer Cognitive-Energy Stack                  │
├─────────────────────────────────────────────────────────────┤
│  L7  Optimization Loop    ∞ retrain · A/B eval · drift det  │
│  L6  Physical Execution   TurnBot Matter 1.5 / Thread / BLE  │
│  L5  Decision Orchestration  Priority weighting · constraints│
│  L4  Predictive Simulation   Monte Carlo · TFT forecasting   │
│  L3  Cognitive Core       Health · Energy · Behavior · Env   │
│  L2  Signal Normalization Kalman filter · drift detection    │
│  L1  Bio Ingestion        Biometrics · weather · AMI · BLE   │
└─────────────────────────────────────────────────────────────┘
```

### L3 Agent Consensus Priority
```
Health Agent (highest) → Energy Agent → Behavior Agent → Environment Agent
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 7 |
| Styling | Tailwind CSS 4 + custom design system |
| Animation | Framer Motion 12 |
| Charts | Recharts 2 |
| Routing | Wouter |
| AI Inference | Groq (Llama 3.1) / Anthropic Claude |
| Auth | Local auth with role system (god/admin/viewer) |
| Hardware | TurnBot Mini/Pro/Hub (BLE 5.3 / Matter 1.5) |
| Deployment | Vercel (serverless functions) |
| CI/CD | GitHub → Vercel auto-deploy |

---

## Project Structure

```
src/
├── types/          ← All TypeScript interfaces (single source of truth)
├── hooks/          ← Custom React hooks (useRealtime, etc.)
├── services/       ← Agent logic, API calls, business logic
├── utils/          ← Pure calculation functions (energy, biometrics)
├── components/     ← Reusable UI components
│   ├── NeuralCore.tsx      ← Canvas-rendered 4-agent neural diagram
│   ├── HealthPanel.tsx     ← Live ECG + biometric gauges
│   ├── EnergyPanel.tsx     ← Solar/battery/grid flow
│   ├── BehaviorPanel.tsx   ← Activity patterns + meditation
│   ├── EnvironmentPanel.tsx← Air quality + ambient sensors
│   ├── Layout.tsx          ← Navigation shell (desktop + mobile)
│   ├── BootSplash.tsx      ← Cinematic startup sequence
│   └── AuthScreen.tsx      ← Login / signup
├── pages/          ← Route-level page components
└── lib/            ← Seed data, toast, auth context
api/
└── chat.ts         ← Vercel serverless function (Groq + Anthropic)
```

---

## Getting Started

```bash
git clone https://github.com/T3a165/Aurora-Core.git
cd Aurora-Core
npm install

# Create environment file
cp .env.example .env.local
# Add your GROQ_API_KEY (free at console.groq.com)

npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Key Engineering Decisions

### Before → After Refactoring

| Before | After |
|---|---|
| Types inline everywhere | Central `src/types/index.ts` |
| Energy math in components | `src/utils/energy.ts` pure functions |
| Agent prompts hardcoded | `src/services/agentService.ts` |
| `useRealtime` in `src/lib/` | `src/hooks/useRealtime.ts` with JSDoc |
| No README | This document |
| Monolithic CSS | Semantic design tokens |

### Design Principles
- **Separation of concerns** — types, utils, services, hooks, components all separate
- **Pure functions for math** — `calcCO2Avoided()`, `calcWellnessScore()` are testable
- **Single source of truth** — all interfaces in `types/index.ts`
- **Progressive enhancement** — works without API key (demo data), better with it

---

## TurnBot Integration

Aurora Core's L6 execution layer controls TurnBot smart actuators:

| Model | Torque | Protocol | Use Case |
|---|---|---|---|
| TurnBot Mini | 5 Nm | BLE 5.3 | HVAC valves, thermostats |
| TurnBot Pro | 25 Nm | Matter 1.5 | Main shutoffs, heavy valves |
| TurnBot Hub | Mesh | ESP32-C6 | 32-node network controller |

**Patent**: USPTO Provisional #64/022,558 (filed March 31, 2026)

---

## Roadmap

- [ ] Real ESP32 sensor WebSocket ingest (replace simulated data)
- [ ] React Native mobile app
- [ ] Green Button API (utility billing integration)
- [ ] OpenADR 2.0b demand response
- [ ] Supabase backend (replace localStorage auth)
- [ ] Jest test suite for utility functions
- [ ] Biometric wearable SDK integration (Apple Health, Garmin)

---

## The Why

> *"I don't have much right now. But I have you, Zachary. And I have a plan. And I have today. That's enough to start."*
>
> — Garrett Lee McLain, Jamaica Beach, Texas, 2026

**Jonas Lee → Darrell Lee → Garrett Lee → Zachary Lee**

The line continues. The name carries forward. Always.

---

Built with purpose · McLain Systems · Jamaica Beach, Texas · 2026
## License
## 📄 License

Aurora Core OS is released under the Aurora Core OS – Non‑Commercial Open License (ACOS‑NCOL 1.0).

This means:

- ✔ Free for personal use  
- ✔ Free for educational use  
- ✔ Free for research and experimentation  
- ✔ Free to modify and redistribute (non‑commercially)  
- ✘ Not allowed for commercial use  
- ✘ Not allowed in paid products or services  
- ✘ Not allowed in revenue‑generating environments  
- ✘ Not allowed for business or organizational deployment  

Commercial licensing is available upon request.

**Copyright © Garrett McLain**

See the full LICENSE file for complete details.
