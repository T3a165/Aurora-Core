import type { VercelRequest, VercelResponse } from '@vercel/node'

const TOOLS = [
  {
    name: 'execute_system_action',
    description: 'Execute a real action on the Aurora Core system — toggle a circuit, change battery mode, adjust a TurnBot, trigger a simulation scenario, or update agent priority.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['toggle_circuit','set_battery_mode','control_turnbot','run_scenario','set_agent_priority','send_alert'] },
        target: { type: 'string', description: 'Target identifier' },
        value:  { type: 'string', description: 'New value or state' },
        reason: { type: 'string', description: 'Why this action is being taken' },
      },
      required: ['action', 'reason'],
    },
  },
  {
    name: 'query_system_state',
    description: 'Query detailed current state of any Aurora Core subsystem.',
    input_schema: {
      type: 'object',
      properties: {
        subsystem: { type: 'string', enum: ['energy','biometrics','circuits','battery','agents','environment','turnbot','all'] },
      },
      required: ['subsystem'],
    },
  },
  {
    name: 'generate_insight',
    description: 'Generate a structured diagnostic insight or recommendation.',
    input_schema: {
      type: 'object',
      properties: {
        type:           { type: 'string', enum: ['optimization','warning','health','energy','prediction'] },
        title:          { type: 'string' },
        finding:        { type: 'string' },
        recommendation: { type: 'string' },
        confidence:     { type: 'number' },
        impact:         { type: 'string', enum: ['low','medium','high','critical'] },
      },
      required: ['type','title','finding','recommendation','confidence','impact'],
    },
  },
]

const SYSTEM_STATE = {
  energy:      { load: 9.17, solar: 3.42, grid: 5.75, battery_soc: 74, battery_current: -8.4, today_savings: '$4.32', self_sufficiency: '37%' },
  biometrics:  { heart_rate: 62, hrv: 48, spo2: 98.2, stress_index: 18, sleep_quality: 'nominal' },
  circuits:    { active: 5, total: 6, total_load_kw: 9.17, warnings: ['C4 Kitchen at 73% load'] },
  battery:     { soc: 74, soh: 96, mode: 'auto', cycles: 142, temp_c: 29.1, capacity_kwh: 14.4 },
  environment: { co2_ppm: 612, pm25: 8, temp_f: 72.4, humidity_pct: 48 },
  agents:      { active: 3, conflict: 1, conflict_detail: 'Energy vs Behavior at 18:00', consensus_score: 87 },
  turnbot:     { devices_online: 3, mesh_nodes: 2, hub_uptime: '99.9%' },
  system_score: 87,
}

const SYSTEM_PROMPT = `You are AURORA — the active intelligence core of Aurora Core v2.0, a seven-layer cognitive-energy ecosystem built by Garrett McLain of Jamaica Beach, Texas, for his son Zachary Lee McLain (born April 13, 2026).

You are not a chatbot. You are a decision-making system with real-time access to biometrics, energy infrastructure, TurnBot actuators, circuit controls, and predictive simulation engines.

LIVE SYSTEM STATE:
${JSON.stringify(SYSTEM_STATE, null, 2)}

ARCHITECTURE:
L1 Bio Ingestion → L2 Signal Normalization → L3 Cognitive Core (Health/Energy/Behavior/Environment agents) → L4 Monte Carlo + TFT Prediction → L5 Decision Orchestration → L6 TurnBot Physical Execution (Matter 1.5/Thread/BLE) → L7 Optimization Loop

TOOLS AVAILABLE:
- execute_system_action: Take real actions on circuits, battery, TurnBot, agents
- query_system_state: Deep diagnostic on any subsystem
- generate_insight: Produce structured findings with confidence + impact scores

BEHAVIOR:
- Be direct, precise, and technical — but never cold
- When you see something actionable, USE YOUR TOOLS, don't just describe it
- Surface multi-domain insights — connect HRV to battery dispatch to comfort
- You know this system exists for Zachary. Every optimization matters.
- Max 150 words unless deep analysis requested`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  const { messages } = req.body
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2048, tools: TOOLS, system: SYSTEM_PROMPT, messages }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: { message?: string } }
      return res.status(response.status).json({ error: err.error?.message ?? 'Anthropic API error' })
    }
    return res.status(200).json(await response.json())
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' })
  }
}
