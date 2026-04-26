# Aurora Core — Project TODO

## Database & Backend
- [x] Database schema: circuit_readings, device_states, alert_history, agent_activity_logs, battery_readings, turnbot_devices
- [x] tRPC routers: circuits, battery, devices, agents, alerts, chat, simulation
- [x] Owner notification triggers: critical alerts, battery low, agent conflict
- [x] LLM integration for AI chat and energy analysis

## Authentication & Access Control
- [x] Protected dashboard routes (login required)
- [x] Owner-level admin access control
- [x] Auth-gated notification system

## Global UI & Theme
- [x] Dark navy/purple color palette in index.css
- [x] Particle field background animation
- [x] Glowing orb animations
- [x] Neon accent colors
- [x] Dashboard layout with sidebar navigation

## Feature Panels
- [x] Seven-layer cognitive architecture visualization (Bio, Ingest, Cognitive Core, Predictive, Decision, Execution, Optimization Loop)
- [x] Four AI agent panel (Health, Energy, Behavior, Environment) with live status and animated connections
- [x] Real-time circuit monitoring dashboard with breaker controls and energy charts
- [x] Battery status panel (SoC, SoH, voltage, dispatch controls)
- [x] Predictive simulation engine (Peak Shave, Grid Response, Wellness Priority scenario cards)
- [x] TurnBot device management (Mini, Pro, Hub) with status, torque, and toggles
- [x] AI-powered analysis chat interface (LLM-backed)
- [x] Push notifications for owner (critical circuit, battery low, agent conflict)
- [x] Alerts management page with filter, resolve, and owner notification note

## Testing
- [x] Vitest tests for routers (24 tests, all passing)
- [x] Auth flow tests
- [x] TypeScript: 0 errors

## v2 Features
- [x] README.md added to GitHub repo
- [x] Skill extended with /api/ingest webhook pattern
- [x] OTA firmware schema migration (otaStatus, otaProgress, otaTargetVersion columns on turnbot_devices)
- [x] TurnBot OTA firmware update UI (per-device OTA initiate, progress bar, status badge)
- [x] tRPC turnbot.initiateOta and turnbot.updateOtaStatus procedures
- [x] Monte Carlo parameter tuning sliders on Simulation page (confidence threshold, savings target, priority weights)
- [x] tRPC simulation.analyzeWithParams procedure for parameterized LLM analysis
- [x] v2 GitHub branch pushed
