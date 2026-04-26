# Aurora Core — Cognitive-Energy Ecosystem

> **Beta Testing Release** · Full-stack AI dashboard for RV and smart-home energy management

Aurora Core is a seven-layer cognitive AI platform that unifies biometric health monitoring, real-time energy management, and intelligent device control into a single immersive dashboard. It orchestrates four specialized AI agents — **Health**, **Energy**, **Behavior**, and **Environment** — across a continuous feedback loop from raw sensor ingestion through predictive simulation and physical actuator control.

---

## Architecture Overview

The system is organized into seven cognitive layers that form a closed feedback loop:

| Layer | Name | Role |
|---|---|---|
| L1 | **Bio** | Ingests biometric and environmental signals (wearables, sensors, weather, smart meters) |
| L2 | **Ingest** | Normalizes and aligns multi-rate sensor streams across heterogeneous sources |
| L3 | **Cognitive Core** | Four AI agents share weighted state vectors; conflicts resolved by consensus |
| L4 | **Predictive** | Monte Carlo simulation + Temporal Fusion Transformer for multi-horizon forecasting |
| L5 | **Decision** | Priority-weighted orchestration with constraint satisfaction and preference learning |
| L6 | **Execution** | Matter 1.5 / Thread / BLE 5.3 device control via TurnBot actuators and OpenADR 2.0b |
| L7 | **Optimization Loop** | Continuous model retraining, drift detection, and A/B strategy evaluation |

### AI Agents

| Agent | Domain | Responsibilities |
|---|---|---|
| **Health** | Biometrics | HR/HRV, sleep quality, SpO₂, stress index, hardware diagnostics |
| **Energy** | Power | Peak-load shaving, solar/battery dispatch, EV charging, demand response |
| **Behavior** | Routines | Occupancy patterns, schedule optimization, preference encoding |
| **Environment** | Ambient | CO₂, PM2.5, temperature, humidity, weather correlation |

### TurnBot Device Family

| Device | Type | Torque | Protocol | Use Case |
|---|---|---|---|---|
| **TurnBot Mini** | `mini` | 5 Nm | BLE 5.3 | Compact valve/switch actuator |
| **TurnBot Pro** | `pro` | 25 Nm | Matter 1.5 / Thread | Heavy-duty HVAC/EV control |
| **TurnBot Hub** | `hub` | — | ESP32-C6 mesh | Coordinates up to 32 TurnBot nodes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Recharts, Framer Motion |
| API | tRPC 11 (end-to-end type safety, no REST boilerplate) |
| Backend | Node.js + Express 4, TypeScript |
| Database | MySQL / TiDB via Drizzle ORM |
| Auth | Manus OAuth (session cookies, role-based access) |
| AI | Built-in LLM via `invokeLLM` helper (server-side only) |
| Notifications | Built-in `notifyOwner` push notification API |
| Storage | S3-compatible object storage via `storagePut` / `storageGet` |

---

## Local Development Setup

### Prerequisites

- Node.js ≥ 22 and `pnpm` installed globally
- A MySQL-compatible database (local MySQL, PlanetScale, or TiDB)
- Manus OAuth credentials (or a local mock for development)

### 1. Clone the repository

```bash
git clone https://github.com/T3a165/Aurora-Core.git
cd Aurora-Core
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill in the required values (see [Environment Variables](#environment-variables) below):

```bash
cp .env.example .env
```

### 4. Apply the database schema

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

This creates six feature tables: `circuit_readings`, `battery_readings`, `turnbot_devices`, `alert_history`, `agent_activity_logs`, and `chat_messages`.

### 5. Start the development server

```bash
pnpm dev
```

The app runs at `http://localhost:3000`. The first time you open the dashboard, demo data is automatically seeded via `localStorage` guard — no manual seed step required.

### 6. Run tests

```bash
pnpm test
```

All 24 Vitest tests should pass. TypeScript is checked separately:

```bash
pnpm check
```

---

## Environment Variables

All variables must be set in `.env` for local development. In the Manus hosted environment, system variables are injected automatically.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string (e.g., `mysql://user:pass@host:3306/aurora`) |
| `JWT_SECRET` | Yes | Secret for signing session cookies (min 32 chars) |
| `VITE_APP_ID` | Yes | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | Yes | Manus OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Yes | Manus login portal URL (frontend) |
| `BUILT_IN_FORGE_API_URL` | Yes | Manus built-in API base URL (LLM, notifications) |
| `BUILT_IN_FORGE_API_KEY` | Yes | Bearer token for server-side Manus API calls |
| `VITE_FRONTEND_FORGE_API_KEY` | Yes | Bearer token for frontend Manus API calls |
| `VITE_FRONTEND_FORGE_API_URL` | Yes | Manus API URL for frontend |
| `OWNER_OPEN_ID` | Yes | Owner's Manus OAuth ID (grants admin role automatically) |
| `OWNER_NAME` | No | Display name for the owner account |

> **Security note:** Never commit `.env` to version control. The `.gitignore` already excludes it.

---

## Project Structure

```
aurora-core/
├── client/
│   └── src/
│       ├── components/
│       │   └── AuroraDashboardLayout.tsx   # Sidebar, auth gate, particle field
│       ├── pages/
│       │   ├── Dashboard.tsx               # Overview + auto-seed
│       │   ├── CognitiveLayers.tsx         # 7-layer accordion
│       │   ├── AgentPanel.tsx              # 4 agents + SVG connection field
│       │   ├── CircuitMonitor.tsx          # Breaker panel + power charts
│       │   ├── BatteryPanel.tsx            # SoC/SoH gauges + dispatch
│       │   ├── Simulation.tsx              # Monte Carlo scenario cards
│       │   ├── TurnBotPanel.tsx            # Device management
│       │   ├── AIChatPage.tsx              # LLM chat interface
│       │   └── AlertsPage.tsx              # Alert management
│       └── index.css                       # Aurora Core dark theme (OKLCH)
├── server/
│   ├── routers.ts                          # All tRPC procedures
│   ├── db.ts                               # Drizzle query helpers
│   └── aurora-core.test.ts                 # 18 Vitest tests
├── drizzle/
│   └── schema.ts                           # Full database schema
└── todo.md                                 # Feature tracking
```

---

## Features

### Dashboard Overview
The main dashboard auto-seeds six demo circuits, a battery reading, three TurnBot devices, and four agent activity logs on first load. It displays live quick-stats, recent agent activity, and the cognitive layer status at a glance.

### Seven-Layer Cognitive Architecture
An interactive expandable accordion visualizes all seven layers with live throughput metrics, status indicators, and detailed capability descriptions for each layer.

### Four AI Agent Panel
Animated SVG connection lines between agent cards show real-time inter-agent communication pathways. Each agent card displays its current action, confidence score, and conflict status.

### Circuit Monitoring
A breaker panel with per-circuit toggle controls, real-time power readings, and an AreaChart for historical consumption. Toggling critical circuits (main panel, HVAC, EV charger) triggers owner push notifications.

### Battery Management
Circular SVG gauges display state-of-charge and state-of-health. A 24-hour history chart and dispatch controls allow manual battery dispatch. Battery low warnings (SoC ≤ 25%) trigger owner notifications.

### Predictive Simulation
Three Monte Carlo scenario cards — **Peak Shave**, **Grid Response**, and **Wellness Priority** — each display probability scores, estimated savings, and a RadarChart. An "Analyze with AI" button invokes the LLM for a plain-English scenario assessment.

### TurnBot Device Management
Cards for TurnBot Mini, Pro, and Hub show connection status, torque readings, position bars, battery level, and firmware version. On/off toggles update device state in real time.

### AI Chat
An LLM-powered chat interface with Aurora Core system context. Supports natural language queries about system status, energy optimization, and predictive simulation results. Chat history is persisted per user.

### Alerts & Notifications
Owner push notifications fire automatically on three triggers: critical circuit toggled off, battery SoC ≤ 25%, and agent conflict resolution. All alerts are stored in `alert_history` and can be filtered and resolved from the Alerts page.

---

## Beta Testing Scope

This release is intended for **closed beta testing** by the Aurora Core team. The following areas are in scope for feedback:

| Area | What to Test |
|---|---|
| **Data accuracy** | Verify that seeded demo values (voltage, SoC, torque) are realistic for your hardware |
| **Agent logic** | Confirm that conflict resolution notifications fire correctly |
| **Simulation cards** | Validate that Peak Shave / Grid Response / Wellness Priority probability scores make sense for your energy profile |
| **TurnBot controls** | Test on/off toggle responsiveness and torque display accuracy |
| **AI Chat** | Probe edge cases — ambiguous queries, multi-step energy questions, hardware status requests |
| **Auth flow** | Verify that non-admin users cannot access admin-only actions (test alert creation, owner notifications) |
| **Mobile layout** | Test the responsive sidebar collapse and mobile header on phones and tablets |

### Known Limitations (Beta)

- Circuit and battery data is currently **seeded demo data**. Live ESP32/smart-meter ingestion via `/api/ingest` is planned for v3 (see `skills/aurora-core-builder/references/pages.md` for the webhook pattern).
- The Monte Carlo simulation uses **LLM inference** for qualitative analysis; a full server-side stochastic model is planned for v3.
- TurnBot OTA firmware progress is **simulated client-side** for demo purposes; real OTA requires TurnBot Hub firmware v3.2.0+ with Matter OTA cluster support.

### Reporting Issues

Open a GitHub Issue with the label `beta-feedback`. Include: browser/device, steps to reproduce, expected vs. actual behavior, and a screenshot if applicable.

---

## Roadmap

| Version | Focus |
|---|---|
| **v1.0** | Full dashboard beta — all 11 features, demo data, LLM chat, owner notifications |
| **v2.0** (current) | TurnBot OTA firmware update UI with progress simulation, Monte Carlo parameter tuning sliders, 24 Vitest tests |
| **v3.0** (planned) | Live sensor ingest (`/api/ingest` webhook), mobile app (React Native), Green Button API, OpenADR 2.0b |

---

## License

Proprietary — Aurora Core and TurnBot are registered trademarks. All rights reserved.
