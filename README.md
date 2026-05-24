<div align="center">

# AURORA CORE OS
### v2.0 · McLain Systems

**Hybrid cognitive engine for energy, biometrics, and environment.**  
REST API · WebSocket · Webhooks · AI Chat · TypeScript + Python SDKs

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/T3a165/Aurora-Core)

[Live Demo](https://aurora-core-3j6h.vercel.app) · [API Docs](aurora-core-os/docs/api-reference.md) · [Dev Portal](https://aurora-core-3j6h.vercel.app/#/dev)

</div>

---

## What is Aurora?

Aurora Core OS is a real-time cognitive engine that manages three domains of a connected environment:

| Domain | Sensors | Score contribution |
|---|---|---|
| **Energy** | Solar, load, battery SoC, grid tariff | Demand/supply balance, self-consumption, cost |
| **Biometrics** | HR, HRV, stress (0–100) | Strain detection — non-medical, conservative |
| **Environment** | Temp, humidity, CO₂ ppm, PM2.5 | Comfort and air-quality safety |

It computes a **System Score (0–100)**, generates human-readable **signals**, and issues **device actions** — automatically, in real time, with every incoming sensor reading.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  External devices / sensors / wearables                     │
│  (Enphase, Tesla, Ecobee, Home Assistant, MQTT, Shelly...)  │
└────────────────────┬────────────────────────────────────────┘
                     │ POST /v1/events
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Aurora Core Engine (Node/TypeScript)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ingest → State (Redis) → Score + Signals → Actions  │   │
│  │  + Trend detection  + Predictive score               │   │
│  └──────────────────────────────────────────────────────┘   │
│  REST API  ·  WebSocket stream  ·  Webhooks                 │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┴──────────────────────────────┐
    │                                     │
    ▼                                     ▼
PostgreSQL (events, insights,         Redis (live state,
 actions, audit, webhooks)            pub/sub, rate limit)
    │
    ▼
┌──────────────────────────────────────────────────────────┐
│  Frontends                                               │
│  Aurora Console (Next.js) · Aurora Vite App (deployed)  │
└──────────────────────────────────────────────────────────┘
```

---

## Quick Start (15 minutes)

```bash
git clone https://github.com/T3a165/Aurora-Core.git
cd Aurora-Core/aurora-core-os
docker compose up -d          # Postgres + Redis
cd apps/api
pnpm install
pnpm prisma migrate dev
pnpm seed                     # prints installation ID + API key
pnpm dev                      # → http://localhost:4000
```

Send your first event:
```bash
curl -X POST http://localhost:4000/v1/events \
  -H "Authorization: Bearer ak_..." \
  -H "Content-Type: application/json" \
  -d '{"domain":"ENERGY","kind":"solar_w","value":1240}'
# → {"accepted":1,"results":[{"score":87,"trend":"stable"}]}
```

No sensors? Inject demo data instantly:
```bash
curl -X POST http://localhost:4000/v1/simulate \
  -H "Authorization: Bearer ak_..." \
  -d '{"scenario":"stress"}'
```

---

## SDKs

**Node/TypeScript**
```ts
import { AuroraClient } from "@aurora/sdk";
const aurora = new AuroraClient({ baseUrl: "http://localhost:4000", apiKey: "ak_..." });

await aurora.sendEvent({ domain: "ENERGY", kind: "solar_w", value: 1240 });
const { current } = await aurora.getInsights();
console.log(`Score: ${current.score}/100 (${current.trend})`);

const off = aurora.subscribe(msg => {
  if (msg.type === "action") console.log("Aurora says:", msg.action.command);
});
```

**Python**
```python
from aurora import AuroraClient
aurora = AuroraClient(api_key="ak_...", base_url="http://localhost:4000")

aurora.send_event({"domain": "ENERGY", "kind": "solar_w", "value": 1240})
data = aurora.get_insights()
print(f"Score: {data['current']['score']}/100")
```

---

## API Highlights

| Endpoint | Description |
|---|---|
| `POST /v1/events` | Send sensor readings (single or batch) |
| `GET /v1/state` | Current live state |
| `GET /v1/insights` | Score + signals + trend + prediction |
| `GET /v1/history` | Event time-series query |
| `POST /v1/devices/:id/command` | Issue device command |
| `POST /v1/config/mode` | Switch energy/health/habitat mode |
| `POST /v1/chat` | AI natural language query (Claude-powered) |
| `POST /v1/webhooks` | Register webhook endpoint |
| `POST /v1/simulate` | Inject demo scenario |
| `GET /v1/export` | Full installation snapshot |
| `GET /health` | Health check (DB + Redis) |
| `GET /metrics` | Prometheus metrics |

Full docs: [aurora-core-os/docs/api-reference.md](aurora-core-os/docs/api-reference.md)

---

## Modes

| Mode | Energy weight | Bio weight | Env weight |
|---|---|---|---|
| **Energy Guardian** | 60% | 15% | 25% |
| **Health Sentinel** | 15% | 60% | 25% |
| **Habitat Optimizer** | 33% | 33% | 34% |

---

## Repo Structure

```
Aurora-Core/
├── aurora-core-os/           # Full production platform
│   ├── apps/
│   │   ├── api/              # Express + Prisma + Redis backend
│   │   ├── web/              # Next.js console frontend
│   │   └── jarvis/           # Voice AI companion (experimental)
│   ├── packages/
│   │   ├── sdk-node/         # TypeScript SDK
│   │   └── sdk-python/       # Python SDK
│   └── docs/                 # API reference, concepts, security
├── src/                      # Deployed Vite app (aurora-core-3j6h.vercel.app)
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── DevPortal.tsx     # ← Developer Portal (new)
│   │   └── ...
│   └── components/
└── api/                      # Vercel serverless functions
    └── chat.ts               # Claude AI proxy
```

---

## Contributing

Attribution: Original C++ (TriforceSystem) and Verilog (ARCHANGEL_CORE) by Alexander Colclough (@Lex-Col), used with permission.

Safety note: Bio scoring is intentionally non-medical and conservative. Aurora produces action *records* — your device adapter decides whether to execute them. Never use Aurora as a clinical device.

---

<div align="center">
Built with purpose. · McLain Systems · 2025
</div>
