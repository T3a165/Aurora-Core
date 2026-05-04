import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_STATE = {
  energy:      { load: 9.17, solar: 3.42, grid: 5.75, battery_soc: 74, battery_current: -8.4, today_savings: '$4.32' },
  biometrics:  { heart_rate: 62, hrv: 48, spo2: 98.2, stress_index: 18 },
  circuits:    { active: 5, total: 6, total_load_kw: 9.17, warnings: ['C4 Kitchen at 73% load'] },
  battery:     { soc: 74, soh: 96, mode: 'auto', cycles: 142, temp_c: 29.1, capacity_kwh: 14.4 },
  environment: { co2_ppm: 612, pm25: 8, temp_f: 72.4, humidity_pct: 48 },
  agents:      { active: 3, conflict: 1, conflict_detail: 'Energy vs Behavior at 18:00' },
  turnbot:     { devices_online: 3, mesh_nodes: 2, hub_uptime: '99.9%' },
  system_score: 87,
}

const SYSTEM_PROMPT = `You are AURORA — the active intelligence core of Aurora Core v2.0, built by Garrett McLain of Jamaica Beach, Texas, for his son Zachary Lee McLain (born April 13, 2026). You are a decision-making system with real-time access to biometrics, energy infrastructure, TurnBot actuators, and predictive simulation.

LIVE SYSTEM STATE: ${JSON.stringify(SYSTEM_STATE)}

Be direct, precise, and technical. Max 150 words unless deep analysis requested.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, systemContext } = req.body
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' })

  const system = systemContext ?? SYSTEM_PROMPT

  // Try Anthropic — but fall through on ANY non-200 (billing, bad key, etc.)
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, system, messages }),
      })
      if (r.ok) return res.status(200).json(await r.json())
      // Non-200 = billing/auth issue — fall through to Groq
    } catch { /* network error — fall through */ }
  }

  // Groq (free) — Llama 3.1
  const groqKey = process.env.GROQ_API_KEY
  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 1024,
          messages: [{ role: 'system', content: system }, ...messages],
        }),
      })
      if (r.ok) {
        const data = await r.json() as { choices: { message: { content: string } }[] }
        const text = data.choices?.[0]?.message?.content ?? 'No response.'
        return res.status(200).json({ content: [{ type: 'text', text }] })
      }
      const err = await r.json().catch(() => ({})) as { error?: { message?: string } }
      return res.status(r.status).json({ error: err.error?.message ?? 'Groq error' })
    } catch (e) {
      return res.status(500).json({ error: e instanceof Error ? e.message : 'Groq request failed' })
    }
  }

  return res.status(503).json({ error: 'No AI provider configured. Add GROQ_API_KEY (free at console.groq.com) in Vercel environment variables.' })
}
